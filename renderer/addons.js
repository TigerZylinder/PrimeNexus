/**
 * PrimeNexus Add-on & Library Engine
 * Allows adding entire websites, M3U playlists, IPTV feeds, and JSON catalogs
 * with a single URL - no manual JSON editing required.
 */

const RECOMMENDED_ADDONS = [
  {
    id: "addon-iptv-de",
    name: "Öffentlich-Rechtliche TV-Sender (Deutschland)",
    description: "ARD, ZDF, 3sat, KiKa, Phoenix, ARTE, Tagesschau24, WDR, BR, NDR, SWR u.v.m. Komplettes deutsches HLS Live-Angebot.",
    url: "https://iptv-org.github.io/iptv/countries/de.m3u",
    type: "m3u",
    language: "de",
    category: "news",
    badge: "100+ Sender",
    author: "iptv-org Community"
  },
  {
    id: "addon-iptv-hu",
    name: "Magyar Nyilvános Élő Adások (Magyarország)",
    description: "Duna TV, M1, M2, M4 Sport, M5, HírTV, regionális adások és szabadon fogható magyar közvetítések.",
    url: "https://iptv-org.github.io/iptv/countries/hu.m3u",
    type: "m3u",
    language: "hu",
    category: "news",
    badge: "60+ Csatorna",
    author: "iptv-org Community"
  },
  {
    id: "addon-classic-movies",
    name: "Internet Archive: Public Domain Spielfilme",
    description: "Restaurierte Filmklassiker, Stummfilm-Ära, frühe Sci-Fi Meisterwerke und gemeinfreie Filme (Internet Archive).",
    url: "https://ia800300.us.archive.org/32/items/HyppolitALakaj1931/",
    type: "curated_archive",
    language: "multi",
    category: "movies",
    badge: "Klassiker",
    author: "Internet Archive / Open Media"
  }
];

class AddonManager {
  constructor() {
    this.addons = [];
    this.addonItemsCache = new Map(); // addonId -> Array of items
    this.isSyncing = false;
  }

  async loadAddons() {
    try {
      if (window.electronAPI && window.electronAPI.getAddons) {
        this.addons = await window.electronAPI.getAddons();
      } else {
        const stored = localStorage.getItem('primenexus_addons');
        this.addons = stored ? JSON.parse(stored) : [...RECOMMENDED_ADDONS];
      }
    } catch (err) {
      console.error('Error loading addons:', err);
      this.addons = [];
    }
    return this.addons;
  }

  async saveAddons() {
    try {
      if (window.electronAPI && window.electronAPI.saveAddons) {
        await window.electronAPI.saveAddons(this.addons);
      }
      localStorage.setItem('primenexus_addons', JSON.stringify(this.addons));
    } catch (err) {
      console.error('Error saving addons:', err);
    }
  }

  getRecommendedAddons() {
    return RECOMMENDED_ADDONS;
  }

  isAddonInstalled(id) {
    return this.addons.some(a => a.id === id);
  }

  async installRecommended(recAddon) {
    if (this.isAddonInstalled(recAddon.id)) {
      return { success: false, error: 'Already installed' };
    }
    const newAddon = {
      ...recAddon,
      enabled: true,
      lastSync: null,
      itemCount: 0
    };
    this.addons.push(newAddon);
    await this.saveAddons();
    return await this.syncAddon(newAddon.id);
  }

  async addCustomAddon({ name, url, type, language }) {
    const id = 'addon-custom-' + Date.now();
    const newAddon = {
      id,
      name: name.trim(),
      url: url.trim(),
      type: type || 'm3u',
      language: language || 'multi',
      category: 'news',
      enabled: true,
      lastSync: null,
      itemCount: 0,
      author: 'Custom Library'
    };
    this.addons.push(newAddon);
    await this.saveAddons();
    return await this.syncAddon(id);
  }

  async toggleAddon(id, enabled) {
    const addon = this.addons.find(a => a.id === id);
    if (addon) {
      addon.enabled = enabled;
      await this.saveAddons();
    }
  }

  async removeAddon(id) {
    this.addons = this.addons.filter(a => a.id !== id);
    this.addonItemsCache.delete(id);
    localStorage.removeItem(`primenexus_cache_${id}`);
    await this.saveAddons();
  }

  async syncAddon(id) {
    const addon = this.addons.find(a => a.id === id);
    if (!addon) return { success: false, error: 'Addon not found' };

    try {
      // Special handler for curated archive fallback
      if (addon.type === 'curated_archive') {
        const items = this.getArchiveCuratedItems(addon);
        this.addonItemsCache.set(addon.id, items);
        addon.itemCount = items.length;
        addon.lastSync = new Date().toISOString();
        await this.saveAddons();
        return { success: true, count: items.length };
      }

      // Fetch remote content
      let text = '';
      if (window.electronAPI && window.electronAPI.fetchRemote) {
        const res = await window.electronAPI.fetchRemote(addon.url);
        if (!res.success) {
          throw new Error(res.error || 'Netzwerkfehler');
        }
        text = res.text;
      } else {
        const res = await fetch(addon.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
      }

      let parsedItems = [];
      if (addon.type === 'm3u' || addon.url.includes('.m3u')) {
        parsedItems = this.parseM3U(text, addon);
      } else if (addon.type === 'json_feed' || addon.url.includes('.json')) {
        parsedItems = this.parseJsonFeed(text, addon);
      } else {
        // Autodetect
        if (text.trim().startsWith('#EXTM3U') || text.includes('#EXTINF')) {
          parsedItems = this.parseM3U(text, addon);
        } else {
          parsedItems = this.parseJsonFeed(text, addon);
        }
      }

      // Cache results in memory & storage
      this.addonItemsCache.set(addon.id, parsedItems);
      addon.itemCount = parsedItems.length;
      addon.lastSync = new Date().toISOString();
      
      try {
        localStorage.setItem(`primenexus_cache_${addon.id}`, JSON.stringify(parsedItems));
      } catch (e) {
        console.warn('Storage quota exceeded for addon cache, using in-memory only', e);
      }

      await this.saveAddons();
      return { success: true, count: parsedItems.length };
    } catch (err) {
      console.error(`Failed to sync addon ${addon.name}:`, err);
      return { success: false, error: err.message };
    }
  }

  async syncAllEnabledAddons() {
    const promises = this.addons
      .filter(a => a.enabled)
      .map(a => this.syncAddon(a.id));
    return await Promise.all(promises);
  }

  getAllAddonItems() {
    const all = [];
    for (const addon of this.addons) {
      if (!addon.enabled) continue;
      
      let items = this.addonItemsCache.get(addon.id);
      if (!items) {
        // Try restoring from storage cache
        try {
          const stored = localStorage.getItem(`primenexus_cache_${addon.id}`);
          if (stored) {
            items = JSON.parse(stored);
            this.addonItemsCache.set(addon.id, items);
          }
        } catch (e) {
          console.warn('Could not parse stored cache', e);
        }
      }

      if (items && Array.isArray(items)) {
        all.push(...items);
      }
    }
    return all;
  }

  parseM3U(text, addon) {
    const lines = text.split(/\r?\n/);
    const items = [];
    let currentMetadata = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        currentMetadata = this.extractExtInf(line);
      } else if (!line.startsWith('#') && currentMetadata) {
        // Stream URL found
        const streamUrl = line;
        const name = currentMetadata.title || 'Unbenannter Sender';
        const logo = currentMetadata.logo || '';
        const group = currentMetadata.group || '';

        // Map group / tags to category
        let category = 'news';
        const groupLower = (group + ' ' + name).toLowerCase();
        if (/movie|film|kino|cinema/i.test(groupLower)) category = 'movies';
        else if (/anim|cartoon|comic|rajzfilm/i.test(groupLower)) category = 'animation';
        else if (/docu|doku|wissen|ismeretterjeszt/i.test(groupLower)) category = 'docs';
        else if (/sport/i.test(groupLower)) category = 'news';

        items.push({
          id: `addon-${addon.id}-${items.length + 1}`,
          addonId: addon.id,
          addonName: addon.name,
          type: 'livetv',
          title_de: name,
          title_hu: name,
          description_de: `${addon.name} • ${group || 'Live TV Stream'}`,
          description_hu: `${addon.name} • ${group || 'Élő TV adás'}`,
          category: category,
          language: addon.language || 'multi',
          rating: 'LIVE',
          year: '2026',
          streamUrl: streamUrl,
          format: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
          isLive: true,
          poster: logo || this.getFallbackLogo(category)
        });

        currentMetadata = null;
      }
    }

    return items;
  }

  extractExtInf(line) {
    const meta = { title: '', logo: '', group: '', id: '' };
    
    // Extract attributes: key="value"
    const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
    if (logoMatch) meta.logo = logoMatch[1];

    const groupMatch = line.match(/group-title="([^"]*)"/i);
    if (groupMatch) meta.group = groupMatch[1];

    const idMatch = line.match(/tvg-id="([^"]*)"/i);
    if (idMatch) meta.id = idMatch[1];

    // The display title is everything after the last comma
    const commaIndex = line.lastIndexOf(',');
    if (commaIndex !== -1) {
      meta.title = line.substring(commaIndex + 1).trim();
    }

    return meta;
  }

  parseJsonFeed(text, addon) {
    try {
      const data = JSON.parse(text);
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.items)) {
        list = data.items;
      } else if (Array.isArray(data.streams)) {
        list = data.streams;
      } else if (Array.isArray(data.channels)) {
        list = data.channels;
      }

      return list.map((item, idx) => ({
        id: `addon-${addon.id}-${item.id || idx}`,
        addonId: addon.id,
        addonName: addon.name,
        type: item.type || (item.isLive ? 'livetv' : 'movie'),
        title_de: item.title_de || item.title || item.name || 'Unbenannt',
        title_hu: item.title_hu || item.title || item.name || 'Névtelen',
        description_de: item.description_de || item.description || addon.name,
        description_hu: item.description_hu || item.description || addon.name,
        category: item.category || 'movies',
        language: item.language || addon.language || 'multi',
        rating: item.rating || (item.isLive ? 'LIVE' : '8.0'),
        year: item.year || '2024',
        duration: item.duration || (item.isLive ? undefined : '1 Std.'),
        streamUrl: item.streamUrl || item.url || '',
        format: (item.format || (item.streamUrl && item.streamUrl.includes('.m3u8') ? 'hls' : 'mp4')),
        isLive: item.isLive || false,
        poster: item.poster || item.logo || item.image || this.getFallbackLogo(item.category),
        episodes: item.episodes || undefined
      }));
    } catch (e) {
      console.error('Failed to parse JSON feed:', e);
      return [];
    }
  }

  getArchiveCuratedItems(addon) {
    return [
      {
        id: `addon-${addon.id}-1`,
        addonId: addon.id,
        addonName: addon.name,
        type: "movie",
        title_de: "A Trip to the Moon (Die Reise zum Mond - 1902)",
        title_hu: "Utazás a Holdba (1902)",
        description_de: "Georges Méliès' bahnbrechender Science-Fiction-Meilenstein, digital restauriert aus dem Internet Archive.",
        description_hu: "Georges Méliès úttörő sci-fi klasszikusa 1902-ből, digitálisan felújítva.",
        category: "movies",
        language: "multi",
        rating: "9.2",
        year: "1902",
        duration: "13 Min.",
        streamUrl: "https://ia800501.us.archive.org/10/items/TripToTheMoon1902/TripToTheMoon.mp4",
        format: "mp4",
        isLive: false,
        poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
      },
      {
        id: `addon-${addon.id}-2`,
        addonId: addon.id,
        addonName: addon.name,
        type: "movie",
        title_de: "Metropolis (Fritz Lang 1927 Restored)",
        title_hu: "Metropolis (Fritz Lang 1927)",
        description_de: "Legendärer expressionistischer Science-Fiction-Klassiker von Fritz Lang (Public Domain).",
        description_hu: "Fritz Lang legendás expresszionista sci-fi remekműve.",
        category: "movies",
        language: "multi",
        rating: "9.4",
        year: "1927",
        duration: "2 Std. 25 Min.",
        streamUrl: "https://ia800301.us.archive.org/24/items/MetropolisFritzLang1927/Metropolis.mp4",
        format: "mp4",
        isLive: false,
        poster: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=80"
      }
    ];
  }

  getFallbackLogo(category) {
    if (category === 'movies') {
      return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80";
    } else if (category === 'animation') {
      return "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80";
    } else if (category === 'docs') {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80";
  }
}

// Global singleton instance
window.addonManager = new AddonManager();

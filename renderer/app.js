let rawBaseSources = [];
let sources = [];
let activeTab = 'all'; // 'all', 'movies', 'series', 'livetv'
let activeLanguageFilter = 'all';
let searchQuery = '';
let player = null;
let editingSourceId = null;
let featuredSource = null;
let currentOpenSeries = null;

// DOM Elements
const catalogView = document.getElementById('catalog-view');
const playerView = document.getElementById('player-view');
const searchInput = document.getElementById('search-input');
const btnManageSources = document.getElementById('btn-manage-sources');
const btnLangToggle = document.getElementById('btn-lang-toggle');
const btnBackToCatalog = document.getElementById('btn-back-to-catalog');
const countBadge = document.getElementById('sources-count-badge');

// Prime Navigation Tabs
const navLinks = document.querySelectorAll('.nav-link');
const langPills = document.querySelectorAll('.lang-pill');

// Hero Showcase Elements
const heroSection = document.getElementById('hero-showcase');
const heroBackdrop = document.getElementById('hero-backdrop');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroRating = document.getElementById('hero-rating');
const btnHeroPlay = document.getElementById('btn-hero-play');
const btnHeroDetails = document.getElementById('btn-hero-details');
const heroDetailsText = document.getElementById('hero-details-text');

// Rails & Containers
const railsContainer = document.getElementById('prime-rails-container');
const railSeries = document.getElementById('rail-series');
const railMovies = document.getElementById('rail-movies');
const railLiveTv = document.getElementById('rail-livetv');
const railAnimation = document.getElementById('rail-animation');

const railSeriesSec = document.getElementById('rail-series-section');
const railMoviesSec = document.getElementById('rail-movies-section');
const railLiveTvSec = document.getElementById('rail-livetv-section');
const railAnimationSec = document.getElementById('rail-animation-section');

// Search Results Section
const searchSection = document.getElementById('search-results-section');
const searchGrid = document.getElementById('search-grid');
const emptyNotice = document.getElementById('empty-notice');

// Series Modal Elements
const seriesModal = document.getElementById('series-modal');
const btnSeriesModalClose = document.getElementById('btn-series-modal-close');
const seriesModalBackdrop = document.getElementById('series-modal-backdrop');
const seriesModalTitle = document.getElementById('series-modal-title');
const seriesModalDesc = document.getElementById('series-modal-desc');
const seriesModalEpCount = document.getElementById('series-modal-ep-count');
const seriesEpisodesList = document.getElementById('series-episodes-list');

// Window buttons
const btnWinMin = document.getElementById('btn-win-min');
const btnWinMax = document.getElementById('btn-win-max');
const btnWinClose = document.getElementById('btn-win-close');

// Modal Elements
const modalOverlay = document.getElementById('source-modal');
const btnModalClose = document.getElementById('btn-modal-close');
const btnAddSourceModal = document.getElementById('btn-add-source');
const btnImportJson = document.getElementById('btn-import-json');
const btnExportJson = document.getElementById('btn-export-json');
const btnResetDefaults = document.getElementById('btn-reset-defaults');
const sourcesListContainer = document.getElementById('modal-sources-list');
const sourceForm = document.getElementById('source-edit-form');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Form inputs
const inputTitleDe = document.getElementById('form-title-de');
const inputTitleHu = document.getElementById('form-title-hu');
const inputUrl = document.getElementById('form-url');
const selectType = document.getElementById('form-type');
const selectCat = document.getElementById('form-category');
const selectLang = document.getElementById('form-language');
const selectFormat = document.getElementById('form-format');
const inputPoster = document.getElementById('form-poster');
const inputDescDe = document.getElementById('form-desc-de');
const inputDescHu = document.getElementById('form-desc-hu');
const checkIsLive = document.getElementById('form-is-live');

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Media Player
  const videoElem = document.getElementById('main-video');
  const containerElem = document.getElementById('video-container');
  player = new MediaPlayer(videoElem, containerElem);

  // Expose Live TV channels renderer for in-player zapper
  window.renderPlayerLiveChannels = renderLiveChannelsInPlayer;

  // Window Controls
  btnWinMin.addEventListener('click', () => window.electronAPI.minimizeWindow());
  btnWinMax.addEventListener('click', () => window.electronAPI.maximizeWindow());
  btnWinClose.addEventListener('click', () => window.electronAPI.closeWindow());

  // Setup Language
  btnLangToggle.addEventListener('click', () => {
    const nextLang = currentLang === 'de' ? 'hu' : 'de';
    setLanguage(nextLang);
    updateLangButton();
  });
  updateLangButton();
  applyTranslations();

  // Load Sources
  await loadSources();

  // Setup Listeners
  setupNavigationTabs();
  setupLanguageFilterPills();
  setupSearch();
  setupRailScrollButtons();
  setupSeriesModal();
  setupSourceManagerModal();
  setupAddonManagerModal();
  setupEPGModal();

  btnBackToCatalog.addEventListener('click', () => {
    stopAndReturnToCatalog();
  });

  document.getElementById('btn-retry-stream').addEventListener('click', () => {
    if (player.currentSource) {
      player.load(player.currentSource);
    }
  });

  // Hero Actions
  if (btnHeroPlay) {
    btnHeroPlay.addEventListener('click', () => {
      if (!featuredSource) return;
      if (featuredSource.type === 'series') {
        startPlaybackSeriesEpisode(featuredSource, 0);
      } else {
        startPlayback(featuredSource);
      }
    });
  }

  if (btnHeroDetails) {
    btnHeroDetails.addEventListener('click', () => {
      if (!featuredSource) return;
      if (featuredSource.type === 'series') {
        openSeriesModal(featuredSource);
      } else {
        startPlayback(featuredSource);
      }
    });
  }

  window.addEventListener('languageChanged', () => {
    updateHero();
    renderCatalog();
    renderModalSourcesList();
    renderInstalledAddons();
    renderRecommendedAddons();
    if (window.renderEPG) window.renderEPG();
  });
});

function updateLangButton() {
  btnLangToggle.textContent = currentLang === 'de' ? '🇩🇪 Deutsch' : '🇭🇺 Magyar';
}

async function loadSources() {
  try {
    rawBaseSources = await window.electronAPI.getSources();
    await window.addonManager.loadAddons();

    // Check if any enabled addon is not yet cached and trigger sync
    const enabledAddons = window.addonManager.addons.filter(a => a.enabled);
    for (const addon of enabledAddons) {
      const cached = localStorage.getItem(`primenexus_cache_${addon.id}`);
      if (!cached) {
        // Run sync in background
        window.addonManager.syncAddon(addon.id).then(() => {
          rebuildMergedSources();
        }).catch(e => console.warn('Addon initial sync notice:', e));
      }
    }

    rebuildMergedSources();
  } catch (err) {
    console.error('Failed to load sources:', err);
  }
}

function rebuildMergedSources() {
  const addonItems = window.addonManager.getAllAddonItems();
  sources = [...rawBaseSources, ...addonItems];
  assignChannelNumbersAndSorting(sources);
  updateHero();
  renderCatalog();
}

function assignChannelNumbersAndSorting(sourceList) {
  const liveChannels = sourceList.filter(s => s.type === 'livetv' || s.isLive);

  // Group by language
  const deChannels = liveChannels.filter(c => c.language === 'de');
  const huChannels = liveChannels.filter(c => c.language === 'hu');
  const otherChannels = liveChannels.filter(c => c.language !== 'de' && c.language !== 'hu');

  // For DE channels: use fixedChannelNumber if set, otherwise auto-assign after the last fixed number
  assignGroupNumbers(deChannels);
  assignGroupNumbers(huChannels);
  assignGroupNumbers(otherChannels);
}

function assignGroupNumbers(channels) {
  // Sort: channels with fixedChannelNumber come first (by that number), then the rest
  channels.sort((a, b) => {
    const fA = a.fixedChannelNumber || 9999;
    const fB = b.fixedChannelNumber || 9999;
    return fA - fB;
  });

  // Build a set of used numbers
  const usedNumbers = new Set();
  channels.forEach(ch => {
    if (ch.fixedChannelNumber) {
      ch.channelNumber = ch.fixedChannelNumber;
      ch.channelFormattedNumber = String(ch.fixedChannelNumber).padStart(2, '0');
      usedNumbers.add(ch.fixedChannelNumber);
    }
  });

  // Auto-assign remaining channels
  let autoNum = 1;
  channels.forEach(ch => {
    if (!ch.fixedChannelNumber) {
      while (usedNumbers.has(autoNum)) autoNum++;
      ch.channelNumber = autoNum;
      ch.channelFormattedNumber = String(autoNum).padStart(2, '0');
      usedNumbers.add(autoNum);
      autoNum++;
    }
  });
}

// Zapping via number keys (1-9) like on a TV
window.zapToChannelNumber = (num) => {
  const currentSourceLang = player.currentSource?.language || 'de';
  const liveChannels = sources.filter(s => s.type === 'livetv' || s.isLive);
  
  // Find channel with matching number in current language, or fallback
  const target = liveChannels.find(c => c.language === currentSourceLang && c.channelNumber === num) ||
                 liveChannels.find(c => c.channelNumber === num);
  
  if (target) {
    player.load(target);
  }
};

function setupNavigationTabs() {
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      activeTab = link.getAttribute('data-tab');
      renderCatalog();
    });
  });
}

function setupLanguageFilterPills() {
  langPills.forEach(pill => {
    pill.addEventListener('click', () => {
      langPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeLanguageFilter = pill.getAttribute('data-lang');
      renderCatalog();
    });
  });
}

function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderCatalog();
  });
}

function setupRailScrollButtons() {
  document.querySelectorAll('.rail-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const track = document.getElementById(targetId);
      if (!track) return;
      const isNext = btn.classList.contains('rail-nav-next');
      const scrollAmount = 640;
      track.scrollBy({ left: isNext ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    });
  });
}

function updateHero() {
  if (!sources || sources.length === 0) {
    if (heroSection) heroSection.style.display = 'none';
    return;
  }

  // Prioritize an awesome featured series or movie
  featuredSource = sources.find(s => s.type === 'series') || sources.find(s => s.type === 'movie') || sources[0];

  if (!featuredSource || !heroSection) return;

  heroSection.style.display = 'block';
  const title = currentLang === 'hu' ? (featuredSource.title_hu || featuredSource.title_de) : (featuredSource.title_de || featuredSource.title_hu);
  const desc = currentLang === 'hu' ? (featuredSource.description_hu || featuredSource.description_de) : (featuredSource.description_de || featuredSource.description_hu);
  const poster = featuredSource.poster || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';

  heroTitle.textContent = title;
  heroDesc.textContent = desc;
  heroBackdrop.style.backgroundImage = `url('${poster}')`;
  if (heroRating) heroRating.textContent = featuredSource.rating || '8.8';

  if (heroDetailsText) {
    heroDetailsText.textContent = featuredSource.type === 'series' ? getTranslation('viewEpisodes') : getTranslation('playNow');
  }
}

function matchesLanguage(src) {
  if (activeLanguageFilter === 'all') return true;
  if (activeLanguageFilter === 'de') return src.language === 'de' || src.language === 'multi';
  if (activeLanguageFilter === 'hu') return src.language === 'hu' || src.language === 'multi';
  if (activeLanguageFilter === 'multi') return src.language === 'multi';
  return true;
}

function renderCatalog() {
  // If searching: switch to search results grid
  if (searchQuery) {
    railsContainer.style.display = 'none';
    heroSection.style.display = 'none';
    searchSection.style.display = 'block';
    renderSearchResults();
    return;
  }

  searchSection.style.display = 'none';
  railsContainer.style.display = 'flex';
  heroSection.style.display = 'block';

  // Filter sources by active language
  const filtered = sources.filter(s => matchesLanguage(s));
  countBadge.textContent = getTranslation('sourceCount', { count: filtered.length });

  // Separate content into categories
  const seriesItems = filtered.filter(s => s.type === 'series');
  const movieItems = filtered.filter(s => s.type === 'movie' || (!s.type && !s.isLive));
  const liveTvItems = filtered.filter(s => s.type === 'livetv' || s.isLive).sort((a, b) => {
    const langPriority = { 'de': 1, 'hu': 2, 'multi': 3 };
    const pA = langPriority[a.language] || 4;
    const pB = langPriority[b.language] || 4;
    if (pA !== pB) return pA - pB;
    return (a.channelNumber || 0) - (b.channelNumber || 0);
  });
  const animationItems = filtered.filter(s => s.category === 'animation');

  // Handle Navigation Tab visibility
  if (activeTab === 'all') {
    railSeriesSec.style.display = seriesItems.length ? 'block' : 'none';
    railMoviesSec.style.display = movieItems.length ? 'block' : 'none';
    railLiveTvSec.style.display = liveTvItems.length ? 'block' : 'none';
    railAnimationSec.style.display = animationItems.length ? 'block' : 'none';
  } else if (activeTab === 'movies') {
    railSeriesSec.style.display = 'none';
    railMoviesSec.style.display = 'block';
    railLiveTvSec.style.display = 'none';
    railAnimationSec.style.display = 'none';
  } else if (activeTab === 'series') {
    railSeriesSec.style.display = 'block';
    railMoviesSec.style.display = 'none';
    railLiveTvSec.style.display = 'none';
    railAnimationSec.style.display = 'none';
  } else if (activeTab === 'livetv') {
    railSeriesSec.style.display = 'none';
    railMoviesSec.style.display = 'none';
    railLiveTvSec.style.display = 'block';
    railAnimationSec.style.display = 'none';
  }

  // Populate Tracks
  populateRail(railSeries, seriesItems);
  populateRail(railMovies, movieItems);
  populateRail(railLiveTv, liveTvItems);
  populateRail(railAnimation, animationItems);
}

function populateRail(trackElement, items) {
  trackElement.innerHTML = '';
  if (!items || items.length === 0) {
    trackElement.innerHTML = `<div class="empty-rail-msg">${getTranslation('emptyCatalog')}</div>`;
    return;
  }

  items.forEach(item => {
    const card = createPrimeCard(item);
    trackElement.appendChild(card);
  });
}

function createPrimeCard(src) {
  const card = document.createElement('div');
  card.className = 'prime-card';

  const title = currentLang === 'hu' ? (src.title_hu || src.title_de) : (src.title_de || src.title_hu);
  const desc = currentLang === 'hu' ? (src.description_hu || src.description_de) : (src.description_de || src.description_hu);
  const poster = src.poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80';
  
  const isSeries = src.type === 'series';
  const isLive = src.type === 'livetv' || src.isLive;

  let badgeHtml = '';
  let epgInfoHtml = '';

  if (isLive) {
    const chNum = src.channelFormattedNumber || '01';
    badgeHtml = `
      <span class="channel-num-badge">CH ${chNum}</span>
      <span class="badge badge-live"><span class="live-dot"></span>LIVE</span>
    `;

    // Fetch EPG Info
    if (window.epgManager) {
      const epg = window.epgManager.getCurrentAndNextShow(src);
      if (epg && epg.currentShow) {
        const cur = epg.currentShow;
        const curTitle = currentLang === 'hu' ? cur.title_hu : cur.title_de;
        const next = epg.nextShow;
        const nextTitle = next ? (currentLang === 'hu' ? next.title_hu : next.title_de) : '';

        epgInfoHtml = `
          <div class="card-epg-info">
            <div class="epg-now-row">
              <span class="epg-now-title" title="${curTitle}">🔴 ${curTitle}</span>
              <span class="epg-now-time">${cur.startFormatted} - ${cur.endFormatted}</span>
            </div>
            <div class="epg-progress-bar-bg">
              <div class="epg-progress-bar-fill" style="width: ${cur.progressPercent || 50}%"></div>
            </div>
            ${next ? `<div class="epg-next-row" title="${nextTitle}">⏱ ${getTranslation('upNext')}: ${nextTitle} (${next.startFormatted})</div>` : ''}
          </div>
        `;
      }
    }
  } else if (isSeries) {
    const epCount = src.episodes ? src.episodes.length : 1;
    badgeHtml = `<span class="badge badge-series">${getTranslation('episodesCount', { count: epCount })}</span>`;
  } else {
    badgeHtml = `<span class="badge badge-vod">${src.duration || 'VOD'}</span>`;
  }

  card.innerHTML = `
    <div class="prime-thumb-wrapper">
      <img src="${poster}" alt="${title}" class="prime-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80'"/>
      <div class="card-badges">
        ${badgeHtml}
        <span class="badge badge-lang">${src.language?.toUpperCase() || 'MULTI'}</span>
      </div>
      <div class="prime-play-overlay">
        <svg viewBox="0 0 24 24" class="play-arrow"><polygon points="6 4 19 12 6 20 6 4" fill="currentColor"/></svg>
      </div>
    </div>
    <div class="prime-card-meta">
      <div class="prime-meta-header">
        <span class="prime-rating">★ ${src.rating || '8.5'}</span>
        <span class="prime-year">${src.year || '2024'}</span>
      </div>
      <h3 class="prime-card-title">${title}</h3>
      <p class="prime-card-desc">${desc || ''}</p>
      ${epgInfoHtml}
    </div>
  `;

  card.addEventListener('click', () => {
    if (isSeries) {
      openSeriesModal(src);
    } else {
      startPlayback(src);
    }
  });

  return card;
}

function renderSearchResults() {
  searchGrid.innerHTML = '';
  const filtered = sources.filter(src => {
    if (!matchesLanguage(src)) return false;
    const matchDe = (src.title_de || '').toLowerCase().includes(searchQuery) ||
                    (src.description_de || '').toLowerCase().includes(searchQuery);
    const matchHu = (src.title_hu || '').toLowerCase().includes(searchQuery) ||
                    (src.description_hu || '').toLowerCase().includes(searchQuery);
    return matchDe || matchHu;
  });

  if (filtered.length === 0) {
    emptyNotice.style.display = 'block';
    return;
  }
  emptyNotice.style.display = 'none';

  filtered.forEach(src => {
    const card = createPrimeCard(src);
    searchGrid.appendChild(card);
  });
}

// SERIES DETAIL DRAWER / MODAL
function setupSeriesModal() {
  btnSeriesModalClose.addEventListener('click', () => closeSeriesModal());
  seriesModal.addEventListener('click', (e) => {
    if (e.target === seriesModal) closeSeriesModal();
  });
}

function openSeriesModal(series) {
  currentOpenSeries = series;
  const title = currentLang === 'hu' ? (series.title_hu || series.title_de) : (series.title_de || series.title_hu);
  const desc = currentLang === 'hu' ? (series.description_hu || series.description_de) : (series.description_de || series.description_hu);
  const poster = series.poster || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80';

  seriesModalTitle.textContent = title;
  seriesModalDesc.textContent = desc;
  seriesModalBackdrop.style.backgroundImage = `url('${poster}')`;

  const episodes = series.episodes || [];
  seriesModalEpCount.textContent = getTranslation('episodesCount', { count: episodes.length });

  seriesEpisodesList.innerHTML = '';
  episodes.forEach((ep, index) => {
    const epRow = document.createElement('div');
    epRow.className = 'series-ep-row';

    const epTitle = currentLang === 'hu' ? (ep.title_hu || ep.title_de) : (ep.title_de || ep.title_hu);
    const epDesc = currentLang === 'hu' ? (ep.description_hu || ep.description_de) : (ep.description_de || ep.description_hu);
    const epThumb = ep.poster || poster;
    const hasPlayback = typeof ep.streamUrl === 'string' && /^https?:\/\//i.test(ep.streamUrl);

    epRow.innerHTML = `
      <div class="ep-thumb-box">
        <img src="${epThumb}" alt="${epTitle}" class="ep-thumb" onerror="this.src='${poster}'"/>
        <div class="ep-play-icon">
          <svg viewBox="0 0 24 24"><polygon points="6 4 19 12 6 20 6 4" fill="currentColor"/></svg>
        </div>
      </div>
      <div class="ep-info-box">
        <div class="ep-header">
          <span class="ep-title">${epTitle}</span>
          <span class="ep-duration">${ep.duration || ''}</span>
        </div>
        <p class="ep-desc">${epDesc || ''}</p>
      </div>
    `;

    if (hasPlayback) {
      epRow.addEventListener('click', () => {
        closeSeriesModal();
        startPlaybackSeriesEpisode(series, index);
      });
    } else {
      epRow.classList.add('metadata-only');
      const playIcon = epRow.querySelector('.ep-play-icon');
      if (playIcon) playIcon.style.display = 'none';
      const status = document.createElement('span');
      status.className = 'ep-metadata-label';
      status.textContent = currentLang === 'hu' ? 'Csak metaadatok' : 'Nur Metadaten';
      epRow.querySelector('.ep-header').appendChild(status);
      epRow.setAttribute('aria-disabled', 'true');
      epRow.title = currentLang === 'hu'
        ? 'Ehhez az epizódhoz nincs lejátszási forrás.'
        : 'Für diese Episode ist keine Wiedergabequelle hinterlegt.';
    }

    seriesEpisodesList.appendChild(epRow);
  });

  seriesModal.classList.add('visible');
}

function closeSeriesModal() {
  seriesModal.classList.remove('visible');
}

let activeDrawerLangFilter = 'all';

// IN-PLAYER LIVE TV CHANNEL DRAWER
function renderLiveChannelsInPlayer(container, onSelectCallback) {
  container.innerHTML = '';

  const drawerPills = document.querySelectorAll('.drawer-pill');
  drawerPills.forEach(pill => {
    pill.onclick = () => {
      drawerPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeDrawerLangFilter = pill.getAttribute('data-drawer-lang');
      renderLiveChannelsInPlayer(container, onSelectCallback);
    };
  });

  let liveChannels = sources.filter(s => s.type === 'livetv' || s.isLive);

  // Filter by drawer language
  if (activeDrawerLangFilter === 'de') {
    liveChannels = liveChannels.filter(c => c.language === 'de');
  } else if (activeDrawerLangFilter === 'hu') {
    liveChannels = liveChannels.filter(c => c.language === 'hu');
  } else {
    // Sort: DE first, HU second, Others third
    liveChannels.sort((a, b) => {
      const langPriority = { 'de': 1, 'hu': 2, 'multi': 3 };
      const pA = langPriority[a.language] || 4;
      const pB = langPriority[b.language] || 4;
      if (pA !== pB) return pA - pB;
      return (a.channelNumber || 0) - (b.channelNumber || 0);
    });
  }

  liveChannels.forEach(ch => {
    const row = document.createElement('div');
    const isCurrent = player.currentSource && player.currentSource.id === ch.id;
    row.className = `player-channel-row ${isCurrent ? 'active' : ''}`;

    const title = currentLang === 'hu' ? (ch.title_hu || ch.title_de) : (ch.title_de || ch.title_hu);
    const poster = ch.poster || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80';
    const chNum = ch.channelFormattedNumber || '01';

    let epgSnippet = '';
    if (window.epgManager) {
      const epg = window.epgManager.getCurrentAndNextShow(ch);
      if (epg && epg.currentShow) {
        const curTitle = currentLang === 'hu' ? epg.currentShow.title_hu : epg.currentShow.title_de;
        const nextTitle = epg.nextShow ? (currentLang === 'hu' ? epg.nextShow.title_hu : epg.nextShow.title_de) : '';
        epgSnippet = `
          <span class="channel-epg-now">🔴 ${curTitle} (${epg.currentShow.startFormatted})</span>
          ${nextTitle ? `<span class="channel-epg-next">⏱ ${nextTitle}</span>` : ''}
        `;
      }
    }

    row.innerHTML = `
      <span class="channel-num-tag">${chNum}</span>
      <img src="${poster}" class="channel-row-thumb" alt="${title}"/>
      <div class="channel-row-info">
        <span class="channel-name">${title}</span>
        ${epgSnippet}
      </div>
      <span class="badge badge-lang" style="font-size: 10px;">${(ch.language || 'DE').toUpperCase()}</span>
    `;

    row.addEventListener('click', () => {
      onSelectCallback(ch);
    });

    container.appendChild(row);
  });
}

function startPlayback(source) {
  catalogView.style.display = 'none';
  playerView.style.display = 'flex';
  player.load(source);
}

function startPlaybackSeriesEpisode(series, episodeIndex) {
  catalogView.style.display = 'none';
  playerView.style.display = 'flex';
  player.loadEpisode(series, episodeIndex);
}

function stopAndReturnToCatalog() {
  player.stop();
  playerView.style.display = 'none';
  catalogView.style.display = 'flex';
  updateHero();
  renderCatalog();
}

// MODAL FOR SOURCES MANAGEMENT
function setupSourceManagerModal() {
  btnManageSources.addEventListener('click', () => openModal());
  btnModalClose.addEventListener('click', () => closeModal());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  btnAddSourceModal.addEventListener('click', () => {
    resetForm();
    sourceForm.style.display = 'block';
    inputTitleDe.focus();
  });

  btnCancelEdit.addEventListener('click', () => resetForm());

  sourceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveSource();
  });

  btnImportJson.addEventListener('click', async () => {
    const res = await window.electronAPI.importSourcesDialog();
    if (res && res.success) {
      sources = res.sources;
      await window.electronAPI.saveSources(sources);
      updateHero();
      renderCatalog();
      renderModalSourcesList();
    } else if (res && res.error) {
      alert(res.error);
    }
  });

  btnExportJson.addEventListener('click', async () => {
    await window.electronAPI.exportSourcesDialog(sources);
  });

  btnResetDefaults.addEventListener('click', async () => {
    if (confirm(getTranslation('confirmReset'))) {
      sources = await window.electronAPI.resetSources();
      updateHero();
      renderCatalog();
      renderModalSourcesList();
      resetForm();
    }
  });
}

function openModal() {
  modalOverlay.classList.add('visible');
  renderModalSourcesList();
  resetForm();
}

function closeModal() {
  modalOverlay.classList.remove('visible');
}

function renderModalSourcesList() {
  sourcesListContainer.innerHTML = '';
  rawBaseSources.forEach((src) => {
    const item = document.createElement('div');
    item.className = 'modal-source-row';

    const title = currentLang === 'hu' ? (src.title_hu || src.title_de) : (src.title_de || src.title_hu);
    const typeLabel = src.type?.toUpperCase() || (src.isLive ? 'LIVE' : 'VOD');

    item.innerHTML = `
      <div class="source-row-info">
        <strong>${title} <span class="badge badge-format">${typeLabel}</span></strong>
        <span class="source-row-url">${src.streamUrl || 'Series with episodes'}</span>
      </div>
      <div class="source-row-actions">
        <button class="btn btn-secondary btn-sm btn-edit">${getTranslation('edit')}</button>
        <button class="btn btn-danger btn-sm btn-del">${getTranslation('delete')}</button>
      </div>
    `;

    item.querySelector('.btn-edit').addEventListener('click', () => {
      populateFormForEdit(src);
    });

    item.querySelector('.btn-del').addEventListener('click', async () => {
      if (confirm(getTranslation('confirmDelete'))) {
        rawBaseSources = rawBaseSources.filter(s => s.id !== src.id);
        await window.electronAPI.saveSources(rawBaseSources);
        rebuildMergedSources();
        renderModalSourcesList();
        if (editingSourceId === src.id) resetForm();
      }
    });

    sourcesListContainer.appendChild(item);
  });
}

function populateFormForEdit(src) {
  editingSourceId = src.id;
  inputTitleDe.value = src.title_de || '';
  inputTitleHu.value = src.title_hu || '';
  inputUrl.value = src.streamUrl || '';
  selectType.value = src.type || (src.isLive ? 'livetv' : 'movie');
  selectCat.value = src.category || 'movies';
  selectLang.value = src.language || 'de';
  selectFormat.value = src.format || 'hls';
  inputPoster.value = src.poster || '';
  inputDescDe.value = src.description_de || '';
  inputDescHu.value = src.description_hu || '';
  checkIsLive.checked = !!src.isLive;

  sourceForm.style.display = 'block';
  sourceForm.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  editingSourceId = null;
  sourceForm.reset();
  sourceForm.style.display = 'none';
}

async function handleSaveSource() {
  const streamUrl = inputUrl.value.trim();
  const type = selectType.value;

  const newSource = {
    id: editingSourceId || 'src-' + Date.now(),
    type: type,
    title_de: inputTitleDe.value.trim() || inputTitleHu.value.trim() || 'Neuer Titel',
    title_hu: inputTitleHu.value.trim() || inputTitleDe.value.trim() || 'Új tartalom',
    streamUrl: streamUrl,
    category: selectCat.value,
    language: selectLang.value,
    format: selectFormat.value,
    poster: inputPoster.value.trim() || '',
    description_de: inputDescDe.value.trim(),
    description_hu: inputDescHu.value.trim(),
    isLive: checkIsLive.checked || type === 'livetv',
    rating: '8.5',
    year: '2024'
  };

  if (editingSourceId) {
    const idx = rawBaseSources.findIndex(s => s.id === editingSourceId);
    if (idx !== -1) rawBaseSources[idx] = newSource;
  } else {
    rawBaseSources.unshift(newSource);
  }

  await window.electronAPI.saveSources(rawBaseSources);
  rebuildMergedSources();
  renderModalSourcesList();
  resetForm();
}

// ==========================================================================
// ADD-ON & LIBRARY MANAGEMENT UI LOGIC
// ==========================================================================

function setupAddonManagerModal() {
  const btnManageAddons = document.getElementById('btn-manage-addons');
  const addonModal = document.getElementById('addon-modal');
  const btnAddonModalClose = document.getElementById('btn-addon-modal-close');
  
  const tabBtnInstalled = document.getElementById('tab-btn-installed');
  const tabBtnAdd = document.getElementById('tab-btn-add');
  const tabBtnStore = document.getElementById('tab-btn-store');

  const tabContentInstalled = document.getElementById('tab-content-installed');
  const tabContentAdd = document.getElementById('tab-content-add');
  const tabContentStore = document.getElementById('tab-content-store');

  const btnSyncAll = document.getElementById('btn-sync-all-addons');
  const addonForm = document.getElementById('addon-create-form');
  const btnCancelAddon = document.getElementById('btn-cancel-addon');

  function switchTab(tabId) {
    [tabBtnInstalled, tabBtnAdd, tabBtnStore].forEach(b => b.classList.remove('active'));
    [tabContentInstalled, tabContentAdd, tabContentStore].forEach(c => c.classList.remove('active'));

    if (tabId === 'installed') {
      tabBtnInstalled.classList.add('active');
      tabContentInstalled.classList.add('active');
      renderInstalledAddons();
    } else if (tabId === 'add') {
      tabBtnAdd.classList.add('active');
      tabContentAdd.classList.add('active');
    } else if (tabId === 'store') {
      tabBtnStore.classList.add('active');
      tabContentStore.classList.add('active');
      renderRecommendedAddons();
    }
  }

  tabBtnInstalled.addEventListener('click', () => switchTab('installed'));
  tabBtnAdd.addEventListener('click', () => switchTab('add'));
  tabBtnStore.addEventListener('click', () => switchTab('store'));

  btnManageAddons.addEventListener('click', () => {
    addonModal.classList.add('visible');
    switchTab('installed');
  });

  btnAddonModalClose.addEventListener('click', () => {
    addonModal.classList.remove('visible');
  });

  addonModal.addEventListener('click', (e) => {
    if (e.target === addonModal) {
      addonModal.classList.remove('visible');
    }
  });

  btnSyncAll.addEventListener('click', async () => {
    btnSyncAll.disabled = true;
    const textSpan = btnSyncAll.querySelector('span');
    const originalText = textSpan ? textSpan.textContent : '';
    if (textSpan) textSpan.textContent = getTranslation('addonSyncing');
    
    await window.addonManager.syncAllEnabledAddons();
    rebuildMergedSources();
    renderInstalledAddons();
    
    btnSyncAll.disabled = false;
    if (textSpan) textSpan.textContent = originalText;
  });

  addonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('addon-input-name').value;
    const url = document.getElementById('addon-input-url').value;
    const type = document.getElementById('addon-input-type').value;
    const language = document.getElementById('addon-input-lang').value;
    const submitBtn = document.getElementById('btn-submit-addon');

    submitBtn.disabled = true;
    submitBtn.textContent = getTranslation('addonSyncing');

    const res = await window.addonManager.addCustomAddon({ name, url, type, language });
    submitBtn.disabled = false;
    submitBtn.textContent = getTranslation('addonSaveBtn');

    if (res.success) {
      addonForm.reset();
      rebuildMergedSources();
      switchTab('installed');
    } else {
      alert(getTranslation('addonSyncError') + ': ' + (res.error || ''));
    }
  });

  if (btnCancelAddon) {
    btnCancelAddon.addEventListener('click', () => {
      addonForm.reset();
      switchTab('installed');
    });
  }
}

function renderInstalledAddons() {
  const container = document.getElementById('installed-addons-list');
  const summary = document.getElementById('addons-status-summary');
  if (!container) return;

  const addons = window.addonManager.addons;
  const activeCount = addons.filter(a => a.enabled).length;
  let totalItems = 0;
  addons.forEach(a => { if (a.enabled) totalItems += (a.itemCount || 0); });

  if (summary) {
    summary.textContent = `${activeCount} / ${addons.length} ${getTranslation('tabInstalledAddons')} (${totalItems} ${getTranslation('sourceCount').replace('{count}', '')})`;
  }

  container.innerHTML = '';

  if (addons.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 15px; margin-bottom: 8px;">Noch keine Bibliotheken oder Add-ons hinzugefügt.</p>
        <p style="font-size: 13px;">Nutze den Tab <strong>"+ Neue Bibliothek / Add-on"</strong> für eine M3U-URL oder aktiviere fertige Bibliotheken im <strong>1-Klick Katalog</strong>.</p>
      </div>
    `;
    return;
  }

  addons.forEach(addon => {
    const card = document.createElement('div');
    card.className = `addon-card ${addon.enabled ? '' : 'disabled'}`;

    const badgeClass = addon.type === 'm3u' ? 'm3u' : (addon.type === 'curated_archive' ? 'archive' : 'json');
    const badgeText = addon.badge || (addon.type === 'm3u' ? 'M3U PLAYLIST' : 'JSON FEED');
    const loadedCountText = getTranslation('addonLoadedCount', { count: addon.itemCount || 0 });
    const lastSyncText = addon.lastSync ? new Date(addon.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Nie';

    card.innerHTML = `
      <div class="addon-info-col">
        <div class="addon-title-row">
          <span class="addon-name">${addon.name}</span>
          <span class="addon-badge ${badgeClass}">${badgeText}</span>
          <span class="badge badge-lang">${(addon.language || 'multi').toUpperCase()}</span>
        </div>
        <div class="addon-desc">${addon.description || ''}</div>
        <div class="addon-meta">
          <span class="addon-url-preview" title="${addon.url}">🔗 ${addon.url}</span>
          <span>•</span>
          <span style="color: #38bdf8; font-weight: 600;">${loadedCountText}</span>
          <span>•</span>
          <span>Sync: ${lastSyncText}</span>
        </div>
      </div>

      <div class="addon-actions-col">
        <label class="addon-switch" title="${addon.enabled ? getTranslation('addonStatusActive') : getTranslation('addonStatusDisabled')}">
          <input type="checkbox" ${addon.enabled ? 'checked' : ''} class="addon-toggle-input">
          <span class="slider-round"></span>
        </label>
        <button class="btn btn-secondary btn-sm btn-sync-single" title="${getTranslation('addonSyncBtn')}">
          <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        </button>
        <button class="btn btn-danger btn-sm btn-del-addon" title="${getTranslation('addonDeleteBtn')}">
          <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        </button>
      </div>
    `;

    // Toggle event
    card.querySelector('.addon-toggle-input').addEventListener('change', async (e) => {
      const isChecked = e.target.checked;
      await window.addonManager.toggleAddon(addon.id, isChecked);
      rebuildMergedSources();
      renderInstalledAddons();
    });

    // Single sync event
    const syncBtn = card.querySelector('.btn-sync-single');
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.style.opacity = '0.5';
      const res = await window.addonManager.syncAddon(addon.id);
      syncBtn.disabled = false;
      syncBtn.style.opacity = '1';
      if (res.success) {
        rebuildMergedSources();
        renderInstalledAddons();
      } else {
        alert(getTranslation('addonSyncError') + ': ' + (res.error || ''));
      }
    });

    // Delete event
    card.querySelector('.btn-del-addon').addEventListener('click', async () => {
      if (confirm(getTranslation('confirmDeleteAddon'))) {
        await window.addonManager.removeAddon(addon.id);
        rebuildMergedSources();
        renderInstalledAddons();
      }
    });

    container.appendChild(card);
  });
}

// ==========================================================================
// EPG TV-PROGRAMM GUIDE MODAL LOGIC
// ==========================================================================

function setupEPGModal() {
  const btnOpenEpg = document.getElementById('btn-open-epg');
  const epgModal = document.getElementById('epg-modal');
  const btnEpgClose = document.getElementById('btn-epg-modal-close');
  const tabDe = document.getElementById('epg-tab-de');
  const tabHu = document.getElementById('epg-tab-hu');
  const tabAll = document.getElementById('epg-tab-all');
  const listContainer = document.getElementById('epg-channels-timeline-list');

  let activeEpgTab = 'de';

  function renderEPG() {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    let liveChannels = sources.filter(s => s.type === 'livetv' || s.isLive);
    if (activeEpgTab === 'de') {
      liveChannels = liveChannels.filter(c => c.language === 'de');
    } else if (activeEpgTab === 'hu') {
      liveChannels = liveChannels.filter(c => c.language === 'hu');
    } else {
      liveChannels.sort((a, b) => {
        const langPriority = { 'de': 1, 'hu': 2, 'multi': 3 };
        const pA = langPriority[a.language] || 4;
        const pB = langPriority[b.language] || 4;
        if (pA !== pB) return pA - pB;
        return (a.channelNumber || 0) - (b.channelNumber || 0);
      });
    }

    if (liveChannels.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">${getTranslation('emptyCatalog')}</div>`;
      return;
    }

    liveChannels.forEach(ch => {
      const block = document.createElement('div');
      block.className = 'epg-channel-block';

      const title = currentLang === 'hu' ? (ch.title_hu || ch.title_de) : (ch.title_de || ch.title_hu);
      const poster = ch.poster || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80';
      const chNum = ch.channelFormattedNumber || '01';

      const epg = window.epgManager ? window.epgManager.getCurrentAndNextShow(ch) : { schedule: [] };
      const currentShowId = epg.currentShow ? epg.currentShow.id : null;

      let timelinePillsHtml = '';
      (epg.schedule || []).forEach(show => {
        const isCurrent = currentShowId && show.id === currentShowId;
        const showTitle = currentLang === 'hu' ? show.title_hu : show.title_de;
        const showDesc = currentLang === 'hu' ? show.desc_hu : show.desc_de;

        timelinePillsHtml += `
          <div class="epg-show-pill ${isCurrent ? 'current' : ''}">
            <div class="show-pill-time">
              <span>${show.startFormatted} - ${show.endFormatted}</span>
              ${isCurrent ? `<span class="show-pill-badge-live">LIVE</span>` : ''}
            </div>
            <div class="show-pill-title" title="${showTitle}">${showTitle}</div>
            <div class="show-pill-desc">${showDesc || ''}</div>
          </div>
        `;
      });

      block.innerHTML = `
        <div class="epg-channel-header">
          <div class="epg-header-left">
            <span class="channel-num-badge">CH ${chNum}</span>
            <img src="${poster}" class="epg-channel-logo" alt="${title}"/>
            <span class="epg-channel-title">${title}</span>
            <span class="badge badge-lang">${(ch.language || 'DE').toUpperCase()}</span>
          </div>
          <button class="btn btn-primary btn-sm btn-epg-zap">
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; margin-right: 4px;"><polygon points="6 4 19 12 6 20 6 4" fill="currentColor"/></svg>
            ${getTranslation('zapToChannel')}
          </button>
        </div>
        <div class="epg-timeline-row">
          ${timelinePillsHtml}
        </div>
      `;

      block.querySelector('.btn-epg-zap').addEventListener('click', () => {
        epgModal.classList.remove('visible');
        startPlayback(ch);
      });

      listContainer.appendChild(block);
    });
  }

  function switchEpgTab(tabKey) {
    [tabDe, tabHu, tabAll].forEach(t => t.classList.remove('active'));
    activeEpgTab = tabKey;
    if (tabKey === 'de') tabDe.classList.add('active');
    else if (tabKey === 'hu') tabHu.classList.add('active');
    else tabAll.classList.add('active');
    renderEPG();
  }

  if (tabDe) tabDe.addEventListener('click', () => switchEpgTab('de'));
  if (tabHu) tabHu.addEventListener('click', () => switchEpgTab('hu'));
  if (tabAll) tabAll.addEventListener('click', () => switchEpgTab('all'));

  if (btnOpenEpg) {
    btnOpenEpg.addEventListener('click', () => {
      epgModal.classList.add('visible');
      renderEPG();
    });
  }

  if (btnEpgClose) {
    btnEpgClose.addEventListener('click', () => {
      epgModal.classList.remove('visible');
    });
  }

  epgModal.addEventListener('click', (e) => {
    if (e.target === epgModal) {
      epgModal.classList.remove('visible');
    }
  });

  window.renderEPG = renderEPG;
}

function renderRecommendedAddons() {
  const container = document.getElementById('recommended-addons-list');
  if (!container) return;

  const recList = window.addonManager.getRecommendedAddons();
  container.innerHTML = '';

  recList.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'addon-store-card';

    const isInstalled = window.addonManager.isAddonInstalled(rec.id);

    card.innerHTML = `
      <div>
        <div class="store-card-header">
          <div>
            <div class="store-card-title">${rec.name}</div>
            <div class="store-card-author">Quelle: ${rec.author} • ${rec.language.toUpperCase()}</div>
          </div>
          <span class="addon-badge m3u">${rec.badge}</span>
        </div>
        <p class="store-card-desc">${rec.description}</p>
      </div>

      <div class="store-card-footer">
        <span style="font-size: 11.5px; color: #94a3b8;">Format: ${rec.type.toUpperCase()}</span>
        ${isInstalled ? `
          <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.8; cursor: default;">
            ✓ ${getTranslation('addonInstalled')}
          </button>
        ` : `
          <button class="btn btn-primary btn-sm btn-install-rec">
            + ${getTranslation('addonInstallBtn')}
          </button>
        `}
      </div>
    `;

    if (!isInstalled) {
      const installBtn = card.querySelector('.btn-install-rec');
      installBtn.addEventListener('click', async () => {
        installBtn.disabled = true;
        installBtn.textContent = getTranslation('addonSyncing');
        const res = await window.addonManager.installRecommended(rec);
        if (res.success) {
          rebuildMergedSources();
          renderRecommendedAddons();
          // Switch to installed tab
          const tabBtnInstalled = document.getElementById('tab-btn-installed');
          if (tabBtnInstalled) tabBtnInstalled.click();
        } else {
          installBtn.disabled = false;
          installBtn.textContent = '+ ' + getTranslation('addonInstallBtn');
          alert(getTranslation('addonSyncError') + ': ' + (res.error || ''));
        }
      });
    }

    container.appendChild(card);
  });
}

// ==========================================================================
// EPG TV-PROGRAMM GUIDE MODAL LOGIC
// ==========================================================================

function setupEPGModal() {
  const btnOpenEpg = document.getElementById('btn-open-epg');
  const epgModal = document.getElementById('epg-modal');
  const btnEpgClose = document.getElementById('btn-epg-modal-close');
  const tabDe = document.getElementById('epg-tab-de');
  const tabHu = document.getElementById('epg-tab-hu');
  const tabAll = document.getElementById('epg-tab-all');
  const listContainer = document.getElementById('epg-channels-timeline-list');

  let activeEpgTab = 'de';

  function renderEPG() {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    let liveChannels = sources.filter(s => s.type === 'livetv' || s.isLive);
    if (activeEpgTab === 'de') {
      liveChannels = liveChannels.filter(c => c.language === 'de');
    } else if (activeEpgTab === 'hu') {
      liveChannels = liveChannels.filter(c => c.language === 'hu');
    } else {
      liveChannels.sort((a, b) => {
        const langPriority = { 'de': 1, 'hu': 2, 'multi': 3 };
        const pA = langPriority[a.language] || 4;
        const pB = langPriority[b.language] || 4;
        if (pA !== pB) return pA - pB;
        return (a.channelNumber || 0) - (b.channelNumber || 0);
      });
    }

    if (liveChannels.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">${getTranslation('emptyCatalog')}</div>`;
      return;
    }

    liveChannels.forEach(ch => {
      const block = document.createElement('div');
      block.className = 'epg-channel-block';

      const title = currentLang === 'hu' ? (ch.title_hu || ch.title_de) : (ch.title_de || ch.title_hu);
      const poster = ch.poster || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80';
      const chNum = ch.channelFormattedNumber || '01';

      const epg = window.epgManager ? window.epgManager.getCurrentAndNextShow(ch) : { schedule: [] };
      const currentShowId = epg.currentShow ? epg.currentShow.id : null;

      let timelinePillsHtml = '';
      (epg.schedule || []).forEach(show => {
        const isCurrent = currentShowId && show.id === currentShowId;
        const showTitle = currentLang === 'hu' ? show.title_hu : show.title_de;
        const showDesc = currentLang === 'hu' ? show.desc_hu : show.desc_de;

        timelinePillsHtml += `
          <div class="epg-show-pill ${isCurrent ? 'current' : ''}">
            <div class="show-pill-time">
              <span>${show.startFormatted} - ${show.endFormatted}</span>
              ${isCurrent ? `<span class="show-pill-badge-live">LIVE</span>` : ''}
            </div>
            <div class="show-pill-title" title="${showTitle}">${showTitle}</div>
            <div class="show-pill-desc">${showDesc || ''}</div>
          </div>
        `;
      });

      block.innerHTML = `
        <div class="epg-channel-header">
          <div class="epg-header-left">
            <span class="channel-num-badge">CH ${chNum}</span>
            <img src="${poster}" class="epg-channel-logo" alt="${title}"/>
            <span class="epg-channel-title">${title}</span>
            <span class="badge badge-lang">${(ch.language || 'DE').toUpperCase()}</span>
          </div>
          <button class="btn btn-primary btn-sm btn-epg-zap">
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; margin-right: 4px;"><polygon points="6 4 19 12 6 20 6 4" fill="currentColor"/></svg>
            ${getTranslation('zapToChannel')}
          </button>
        </div>
        <div class="epg-timeline-row">
          ${timelinePillsHtml}
        </div>
      `;

      block.querySelector('.btn-epg-zap').addEventListener('click', () => {
        epgModal.classList.remove('visible');
        startPlayback(ch);
      });

      listContainer.appendChild(block);
    });
  }

  function switchEpgTab(tabKey) {
    [tabDe, tabHu, tabAll].forEach(t => t.classList.remove('active'));
    activeEpgTab = tabKey;
    if (tabKey === 'de') tabDe.classList.add('active');
    else if (tabKey === 'hu') tabHu.classList.add('active');
    else tabAll.classList.add('active');
    renderEPG();
  }

  if (tabDe) tabDe.addEventListener('click', () => switchEpgTab('de'));
  if (tabHu) tabHu.addEventListener('click', () => switchEpgTab('hu'));
  if (tabAll) tabAll.addEventListener('click', () => switchEpgTab('all'));

  if (btnOpenEpg) {
    btnOpenEpg.addEventListener('click', () => {
      epgModal.classList.add('visible');
      renderEPG();
    });
  }

  if (btnEpgClose) {
    btnEpgClose.addEventListener('click', () => {
      epgModal.classList.remove('visible');
    });
  }

  epgModal.addEventListener('click', (e) => {
    if (e.target === epgModal) {
      epgModal.classList.remove('visible');
    }
  });

  window.renderEPG = renderEPG;
}

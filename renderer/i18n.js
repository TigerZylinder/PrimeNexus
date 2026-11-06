const translations = {
  de: {
    appTitle: "PrimeNexus",
    appSubtitle: "Filme, Serien & Live TV",
    searchPlaceholder: "Filme, Serien, Live TV durchsuchen...",
    manageSources: "Quellen verwalten",
    languageSelect: "Sprache",
    
    // Top Nav
    navHome: "Startseite",
    navMovies: "Filme",
    navSeries: "Serien",
    navLiveTv: "Live TV",
    navCategories: "Kategorien",

    // Prime Hero & Badges
    primeBadge: "PRIME EXKLUSIV",
    featuredBadge: "Heute im Rampenlicht",
    playNow: "Jetzt ansehen",
    viewEpisodes: "Staffeln & Episoden",
    addToWatchlist: "+ Merkliste",
    ratingLabel: "IMDb",

    // Horizontal Carousel Rows
    rowFeatured: "Im Rampenlicht & Top-Empfehlungen",
    rowSeries: "Spannende Serien & Staffeln",
    rowMovies: "Spielfilme & Gemeinfreie Klassiker",
    rowLive: "Live TV & 24/7 Nachrichtensender",
    rowAnimation: "Animation & Open-Source-Highlights",

    // Content types
    typeMovie: "Film",
    typeSeries: "Serie",
    typeLiveTv: "Live TV",

    // Series Detail Drawer
    seasonSelect: "Staffel 1",
    episodesHeader: "Episoden",
    episodesCount: "{count} Episoden",
    seasonsCount: "{count} Staffel",
    playEpisode: "Abspielen",
    nextEpisode: "Nächste Folge",
    zapChannels: "Senderliste",
    channelList: "Verfügbare Live-Sender",
    nowOnAir: "Jetzt auf Sendung",
    tvGuide: "TV-Programm (EPG)",
    tvGuideSubtitle: "Aktuelles Live-Programm und Sendeplan aller Kanäle.",
    nowAiring: "Jetzt läuft",
    upNext: "Danach",
    channelNumber: "Kanal {num}",
    channelsGerman: "🇩🇪 Deutsche TV-Sender",
    channelsHungarian: "🇭🇺 Magyar TV-csatornák",
    channelsInternational: "🌐 Internationale Sender",
    zapToChannel: "Sender einschalten",
    channelZapperTitle: "TV-Sender & Live-Programm",
    allTimeSlots: "Ganzer Tag",
    timelineNow: "Jetzt auf Sendung",

    // Filters
    allCategories: "Alle Genres",
    cat_news: "Nachrichten & Info",
    cat_movies: "Filme & Klassiker",
    cat_animation: "Animation",
    cat_docs: "Dokumentationen",
    cat_custom: "Benutzerdefiniert",
    
    filterAll: "Alle Sprachen",
    filterDe: "Deutsch",
    filterHu: "Magyar",
    filterMulti: "International",

    // In-Player
    nowPlaying: "Aktuelle Wiedergabe",
    backToCatalog: "Zurück zur Übersicht",
    liveStream: "LIVE",
    vodStream: "VOD",
    loadingStream: "Stream wird geladen...",
    resolvingStream: "Stream-Manifest wird initialisiert...",
    reconnecting: "Verbindung wird wiederhergestellt (Versuch {attempt}/3)...",
    streamError: "Stream konnte nicht geladen werden. Bitte prüfe die URL oder Verbindung.",
    reloadStream: "Erneut versuchen",
    qualityAuto: "Qualität: Auto",
    speed: "Geschwindigkeit",
    skipBack10: "10s zurück (J)",
    skipFwd10: "10s vor (L)",
    audioAndSubtitles: "Audio & Untertitel",
    audioTrack: "Audiospur",
    subtitles: "Untertitel",
    subtitlesOff: "Deaktiviert",
    trackDefault: "Standard / Original",
    
    // Modal & Source Management
    modalTitle: "Streaming-Quellen & Feeds",
    modalSubtitle: "Verwalte deine Filme, Serien-Playlists und HLS-Live-TV-Sender.",
    navAddons: "Bibliotheken & Add-ons",
    addonsModalTitle: "Bibliotheken & Add-on Feeds",
    addonsModalSubtitle: "Füge ganze Web-Seiten, M3U-Senderlisten oder Feeds mit nur einer einzigen URL hinzu.",
    tabInstalledAddons: "Meine Bibliotheken",
    tabAddAddon: "+ Neue Bibliothek / Add-on",
    tabAddonStore: "Empfohlene Bibliotheken (1-Klick)",
    addonName: "Name der Bibliothek",
    addonUrl: "Feed- oder Playlist-URL (z. B. M3U / JSON)",
    addonType: "Bibliotheks-Typ",
    addonTypeM3U: "M3U / IPTV Playlist (Ganze Senderliste)",
    addonTypeJson: "Remote JSON Catalog / Web-Feed",
    addonTypeRSS: "Media RSS / Podcast Feed",
    addonLanguage: "Hauptsprache",
    addonSaveBtn: "Bibliothek laden & aktivieren",
    addonSyncBtn: "Aktualisieren",
    addonDeleteBtn: "Entfernen",
    addonStatusActive: "Aktiv",
    addonStatusDisabled: "Inaktiv",
    addonLoadedCount: "{count} Titel geladen",
    addonInstallBtn: "1-Klick Aktivieren",
    addonInstalled: "Aktiviert",
    addonSyncing: "Wird heruntergeladen & analysiert...",
    addonSyncSuccess: "{count} Titel erfolgreich synchronisiert!",
    addonSyncError: "Fehler beim Laden der Bibliothek",
    addonUrlPlaceholder: "https://.../playlist.m3u oder feed.json",
    addonNamePlaceholder: "z.B. ARD & ZDF Mediathek oder Magyar TV",
    confirmDeleteAddon: "Möchtest du diese Bibliothek wirklich entfernen?",
    addSourceBtn: "+ Quelle hinzufügen",
    importJsonBtn: "Feed importieren (JSON)",
    exportJsonBtn: "Feed exportieren",
    resetDefaultsBtn: "Standard wiederherstellen",
    saveSource: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    confirmDelete: "Möchtest du diese Quelle wirklich entfernen?",
    confirmReset: "Möchtest du die Quellen wirklich auf die Werkseinstellungen zurücksetzen?",
    
    // Form fields
    fieldTitleDe: "Titel (Deutsch)",
    fieldTitleHu: "Titel (Ungarisch)",
    fieldUrl: "Stream-URL (m3u8 / mp4 / webm)",
    fieldType: "Typ",
    fieldCategory: "Kategorie / Genre",
    fieldLanguage: "Sprache des Inhalts",
    fieldFormat: "Stream-Format",
    fieldPoster: "Vorschaubild-URL (optional)",
    fieldDescDe: "Beschreibung (Deutsch)",
    fieldDescHu: "Beschreibung (Ungarisch)",
    fieldIsLive: "Ist ein Live-Stream",
    
    emptyCatalog: "Keine Inhalte gefunden, die den Kriterien entsprechen.",
    sourceCount: "{count} Titel verfügbar",
    legalNotice: "PrimeNexus: Native Windows Media Engine für freie, legale HLS- und MP4-Streams ohne Browser-Overhead."
  },
  hu: {
    appTitle: "PrimeNexus",
    appSubtitle: "Filmek, Sorozatok és Élő TV",
    searchPlaceholder: "Filmek, sorozatok, élő csatornák keresése...",
    manageSources: "Források kezelése",
    languageSelect: "Nyelv",
    
    // Top Nav
    navHome: "Kezdőlap",
    navMovies: "Filmek",
    navSeries: "Sorozatok",
    navLiveTv: "Élő TV",
    navCategories: "Kategóriák",

    // Prime Hero & Badges
    primeBadge: "PRIME EXKLUZÍV",
    featuredBadge: "A nap kiemelt ajánlata",
    playNow: "Lejátszás most",
    viewEpisodes: "Évadok és Epizódok",
    addToWatchlist: "+ Megnézendők",
    ratingLabel: "IMDb",

    // Horizontal Carousel Rows
    rowFeatured: "Kiemelt Ajánlatok és Kedvencek",
    rowSeries: "Népszerű Sorozatok és Évadok",
    rowMovies: "Filmek és Közkincs Klasszikusok",
    rowLive: "Élő TV és 24/7 Hírcsatornák",
    rowAnimation: "Animációk és Nyílt Forrású Művek",

    // Content types
    typeMovie: "Film",
    typeSeries: "Sorozat",
    typeLiveTv: "Élő TV",

    // Series Detail Drawer
    seasonSelect: "1. Évad",
    episodesHeader: "Epizódok",
    episodesCount: "{count} epizód",
    seasonsCount: "{count} évad",
    playEpisode: "Lejátszás",
    nextEpisode: "Következő rész",
    zapChannels: "Csatornalista",
    channelList: "Elérhető Élő Csatornák",
    nowOnAir: "Most a képernyőn",
    tvGuide: "Műsorújság (EPG)",
    tvGuideSubtitle: "Minden élő csatorna aktuális műsora és műsorrendje.",
    nowAiring: "Most futó műsor",
    upNext: "Következő adás",
    channelNumber: "{num}. Csatorna",
    channelsGerman: "🇩🇪 Német TV-csatornák",
    channelsHungarian: "🇭🇺 Magyar TV-csatornák",
    channelsInternational: "🌐 Nemzetközi TV-csatornák",
    zapToChannel: "Átkapcsolás ide",
    channelZapperTitle: "Csatornák és Műsorok",
    allTimeSlots: "Egész napos műsor",
    timelineNow: "Élőben most",

    // Filters
    allCategories: "Minden műfaj",
    cat_news: "Hírek és Közélet",
    cat_movies: "Filmek és Klasszikusok",
    cat_animation: "Animáció",
    cat_docs: "Dokumentumfilmek",
    cat_custom: "Egyéni források",
    
    filterAll: "Minden nyelv",
    filterDe: "Német",
    filterHu: "Magyar",
    filterMulti: "Nemzetközi",

    // In-Player
    nowPlaying: "Most játszott",
    backToCatalog: "Vissza a kezdőlapra",
    liveStream: "ÉLŐ",
    vodStream: "VOD",
    loadingStream: "Közvetítés betöltése...",
    resolvingStream: "Közvetítési jegyzék (manifest) elemzése...",
    reconnecting: "Újracsatlakozás ({attempt}/3. kísérlet)...",
    streamError: "A közvetítés nem tölthető be. Kérjük ellenőrizd a kapcsolatot.",
    reloadStream: "Újrapróbálás",
    qualityAuto: "Minőség: Auto",
    speed: "Sebesség",
    skipBack10: "10 mp vissza (J)",
    skipFwd10: "10 mp előre (L)",
    audioAndSubtitles: "Hang és Feliratok",
    audioTrack: "Hangsáv",
    subtitles: "Feliratok",
    subtitlesOff: "Kikapcsolva",
    trackDefault: "Alapértelmezett / Eredeti",
    
    // Modal & Source Management
    modalTitle: "Streaming források és Hírfolyamok",
    modalSubtitle: "Kezeld a filmeket, sorozatokat és élő HLS TV-csatornákat.",
    navAddons: "Könyvtárak és Bővítmények",
    addonsModalTitle: "Könyvtárak és Bővítmények",
    addonsModalSubtitle: "Adj hozzá teljes weboldalakat, M3U lejátszási listákat vagy hírfolyamokat egyetlen URL-lel.",
    tabInstalledAddons: "Telepített könyvtárak",
    tabAddAddon: "+ Új könyvtár / Bővítmény",
    tabAddonStore: "Ajánlott könyvtárak (1-kattintás)",
    addonName: "Könyvtár neve",
    addonUrl: "Hírfolyam vagy Lejátszási lista URL (pl. M3U / JSON)",
    addonType: "Könyvtár típusa",
    addonTypeM3U: "M3U / IPTV lista (Teljes csatornalista)",
    addonTypeJson: "Távoli JSON katalógus / Webes hírfolyam",
    addonTypeRSS: "Média RSS / Videó hírfolyam",
    addonLanguage: "Fő nyelv",
    addonSaveBtn: "Könyvtár betöltése és aktiválása",
    addonSyncBtn: "Frissítés",
    addonDeleteBtn: "Eltávolítás",
    addonStatusActive: "Aktív",
    addonStatusDisabled: "Kikapcsolva",
    addonLoadedCount: "{count} tartalom betöltve",
    addonInstallBtn: "1-Kattintásos aktiválás",
    addonInstalled: "Aktiválva",
    addonSyncing: "Letöltés és feldolgozás folyamatban...",
    addonSyncSuccess: "{count} tartalom sikeresen szinkronizálva!",
    addonSyncError: "Hiba történt a könyvtár betöltése során",
    addonUrlPlaceholder: "https://.../lista.m3u vagy feed.json",
    addonNamePlaceholder: "pl. Magyar Élő Adások vagy Közszolgálati TV",
    confirmDeleteAddon: "Biztosan el szeretnéd távolítani ezt a könyvtárat?",
    addSourceBtn: "+ Forrás hozzáadása",
    importJsonBtn: "Hírfolyam importálása (JSON)",
    exportJsonBtn: "Hírfolyam exportálása",
    resetDefaultsBtn: "Alapértelmezett visszaállítása",
    saveSource: "Mentés",
    cancel: "Mégse",
    delete: "Törlés",
    edit: "Szerkesztés",
    confirmDelete: "Biztosan el szeretnéd távolítani ezt a forrást?",
    confirmReset: "Biztosan visszaállítod a forrásokat az alapértelmezett beállításokra?",
    
    // Form fields
    fieldTitleDe: "Cím (németül)",
    fieldTitleHu: "Cím (magyarul)",
    fieldUrl: "Közvetítés URL (m3u8 / mp4 / webm)",
    fieldType: "Típus",
    fieldCategory: "Műfaj",
    fieldLanguage: "Tartalom nyelve",
    fieldFormat: "Közvetítés formátuma",
    fieldPoster: "Borítókép URL (nem kötelező)",
    fieldDescDe: "Leírás (németül)",
    fieldDescHu: "Leírás (magyarul)",
    fieldIsLive: "Ez egy élő közvetítés",
    
    emptyCatalog: "Nem található a szűrésnek megfelelő tartalom.",
    sourceCount: "{count} tartalom elérhető",
    legalNotice: "PrimeNexus: Natív Windows média lejátszó nyílt és legális HLS/MP4 közvetítésekhez böngészős sallangok nélkül."
  }
};

let currentLang = localStorage.getItem('streamnexus_lang') || 'de';

function getTranslation(key, params = {}) {
  const dict = translations[currentLang] || translations.de;
  let text = dict[key] || translations.de[key] || key;
  for (const p in params) {
    text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
  }
  return text;
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('streamnexus_lang', lang);
    applyTranslations();
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = getTranslation(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', getTranslation(key));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', getTranslation(key));
  });

  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
}

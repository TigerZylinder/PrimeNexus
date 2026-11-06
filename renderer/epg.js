/**
 * PrimeNexus EPG (Electronic Program Guide) Engine
 * Generates realistic, time-accurate TV program schedules,
 * current show progress, and upcoming shows for all live channels.
 */

const KNOWN_EPG_PROGRAMS = {
  // German Channels
  "ard": [
    { start: "06:00", duration: 180, title_de: "ARD Morgenmagazin", title_hu: "Reggeli hírmagazin", desc_de: "Nachrichten, Interviews und Hintergründe zum Start in den Tag.", desc_hu: "Hírek, interjúk és háttérinformációk a nap indításához.", cat: "news" },
    { start: "09:00", duration: 55, title_de: "Tagesschau & Live-Bericht", title_hu: "Híradó és élő tudósítás", desc_de: "Die wichtigsten Meldungen des Vormittags.", desc_hu: "A délelőtt legfontosabb hírei.", cat: "news" },
    { start: "09:55", duration: 50, title_de: "Rote Rosen", title_hu: "Vörös rózsák", desc_de: "Liebeswirren und Familiendrama in Lüneburg.", desc_hu: "Családi dráma és romantika.", cat: "series" },
    { start: "10:45", duration: 50, title_de: "Meister des Alltags", title_hu: "A mindennapok mesterei", desc_de: "Das unterhaltsame Wissensquiz.", desc_hu: "Szórakoztató tudáskvíz.", cat: "show" },
    { start: "11:35", duration: 25, title_de: "In aller Freundschaft", title_hu: "Kórházi történetek", desc_de: "Geschichten aus der Sachsenklinik.", desc_hu: "Történetek a klinikáról.", cat: "series" },
    { start: "12:00", duration: 15, title_de: "Tagesschau 12:00", title_hu: "Déli Híradó", desc_de: "Nachrichten des Tages.", desc_hu: "A nap hírei.", cat: "news" },
    { start: "12:15", duration: 45, title_de: "ARD Buffet", title_hu: "Konyhaművészet és életmód", desc_de: "Kreative Kochideen und Ratgeber.", desc_hu: "Kreatív receptek és életmódtanácsok.", cat: "show" },
    { start: "13:00", duration: 60, title_de: "ZDF-Mittagsmagazin", title_hu: "Déli magazinműsor", desc_de: "Aktuelle Berichte aus Politik, Kultur und Sport.", desc_hu: "Aktuális politikai és kulturális hírek.", cat: "news" },
    { start: "14:00", duration: 10, title_de: "Tagesschau", title_hu: "Hírek 14:00", desc_de: "Kompakte Nachrichtenübersicht.", desc_hu: "Rövid hírösszefoglaló.", cat: "news" },
    { start: "14:10", duration: 50, title_de: "Rote Rosen (Wdh.)", title_hu: "Vörös rózsák (ism.)", desc_de: "Telenovela.", desc_hu: "Telenovella.", cat: "series" },
    { start: "15:00", duration: 10, title_de: "Tagesschau 15:00", title_hu: "Délutáni híradó", desc_de: "Die Lage in Deutschland und weltweit.", desc_hu: "Helyzetjelentés a világból.", cat: "news" },
    { start: "15:10", duration: 50, title_de: "Sturm der Liebe", title_hu: "A szerelem vihara", desc_de: "Geschichten rund um das Fünf-Sterne-Hotel Fürstenhof.", desc_hu: "Intrikák és szerelem a Fürstenhofban.", cat: "series" },
    { start: "16:00", duration: 15, title_de: "Tagesschau mit Börse", title_hu: "Tőzsdehírek és összefoglaló", desc_de: "Wirtschaftsberichte und Weltgeschehen.", desc_hu: "Gazdasági összefoglaló.", cat: "news" },
    { start: "16:15", duration: 55, title_de: "Verrückt nach Meer", title_hu: "Tengeri utazások", desc_de: "Kreuzfahrt-Doku auf den Weltmeeren.", desc_hu: "Dokumentumfilm az óceánjárókról.", cat: "docs" },
    { start: "17:15", duration: 45, title_de: "Brisant", title_hu: "Bulvármagazin", desc_de: "Das Promi- und Lifestylemagazin.", desc_hu: "Sztár- és életmódmagazin.", cat: "show" },
    { start: "18:00", duration: 50, title_de: "Wer weiß denn sowas?", title_hu: "Ki tudja a választ?", desc_de: "Das schlaue Wissensspiel mit Kai Pflaume.", desc_hu: "Izgalmas kvízjáték.", cat: "show" },
    { start: "18:50", duration: 55, title_de: "WaPo Bodensee", title_hu: "Vízi rendőrség", desc_de: "Krimi-Serie am Bodensee.", desc_hu: "Krimisorozat.", cat: "series" },
    { start: "19:45", duration: 15, title_de: "Wissen vor acht & Börse", title_hu: "Tudomány 8 előtt", desc_de: "Faszinierende Wissenschaftsthemen und Aktienkurse.", desc_hu: "Tudományos érdekességek.", cat: "docs" },
    { start: "20:00", duration: 15, title_de: "Tagesschau 20:00", title_hu: "Főműsoridős Híradó 20:00", desc_de: "Die Hauptausgabe der wichtigsten deutschen Nachrichtensendung.", desc_hu: "Németország vezető esti hírműsora.", cat: "news" },
    { start: "20:15", duration: 90, title_de: "Tatort: Das Vermächtnis", title_hu: "Tetthely: Az örökség", desc_de: "Spannender Kriminalfall des Ermittlerteams.", desc_hu: "Izgalmas klasszikus krimi.", cat: "movies" },
    { start: "21:45", duration: 30, title_de: "Tagesthemen", title_hu: "Napi témák és elemzések", desc_de: "Kommentare, Schwerpunkte und Hintergründe.", desc_hu: "Háttérelemzések és interjúk.", cat: "news" },
    { start: "22:15", duration: 75, title_de: "Maischberger Talk", title_hu: "Közéleti vitafórum", desc_de: "Die Diskussionsrunde mit prominenten Gästen.", desc_hu: "Politikai vitaest vendégekkel.", cat: "show" }
  ],
  "tagesschau": [
    { start: "00:00", duration: 60, title_de: "Tagesschau 24 / 7 Live", title_hu: "Tagesschau Élő 24/7", desc_de: "Rund um die Uhr aktuelle Nachrichten aus Politik, Wirtschaft und Weltgeschehen.", desc_hu: "Folyamatos élő hírszolgáltatás a világ minden tájáról.", cat: "news" }
  ],
  "zdf": [
    { start: "06:00", duration: 180, title_de: "ZDF Morgenmagazin", title_hu: "ZDF Reggeli magazin", desc_de: "Politik, Sport und Wetter zur frühen Stunde.", desc_hu: "Reggeli hírek és sport.", cat: "news" },
    { start: "09:00", duration: 90, title_de: "Volle Kanne - Service täglich", title_hu: "Életmód és tippek", desc_de: "Praktische Ratschläge, Gäste am Frühstückstisch.", desc_hu: "Praktikus tanácsok és vendégek.", cat: "show" },
    { start: "10:30", duration: 60, title_de: "Notruf Hafenkante", title_hu: "Kikötői őrség", desc_de: "Polizeidrama in Hamburg.", desc_hu: "Rendőrségi sorozat Hamburgból.", cat: "series" },
    { start: "11:30", duration: 45, title_de: "SOKO Wismar", title_hu: "Különleges ügyosztály", desc_de: "Norddeutsche Ermittler im Einsatz.", desc_hu: "Északi nyomozók akcióban.", cat: "series" },
    { start: "12:15", duration: 45, title_de: "drehscheibe & heute", title_hu: "Közélet és hírek", desc_de: "Magazin aus den Bundesländern.", desc_hu: "Helyi és országos hírek.", cat: "news" },
    { start: "13:00", duration: 60, title_de: "ZDF-Mittagsmagazin", title_hu: "Déli összefoglaló", desc_de: "Aktuelle Berichte.", desc_hu: "Aktuális tudósítások.", cat: "news" },
    { start: "14:00", duration: 15, title_de: "heute - in Deutschland", title_hu: "Hírek Németországból", desc_de: "Wichtige Schlagzeilen.", desc_hu: "Fontosabb hírek.", cat: "news" },
    { start: "14:15", duration: 45, title_de: "Die Küchenschlacht", title_hu: "Konyhai csata", desc_de: "Hobbyköche im kulinarischen Wettstreit.", desc_hu: "Gasztronómiai vetélkedő.", cat: "show" },
    { start: "15:00", duration: 60, title_de: "Bares für Rares", title_hu: "Kincsek és régiségek", desc_de: "Antiquitäten-Show mit Horst Lichter.", desc_hu: "Régiségek és becsüsök bemutatója.", cat: "show" },
    { start: "16:00", duration: 15, title_de: "heute - in Europa", title_hu: "Hírek Európából", desc_de: "Berichte aus europäischen Nachbarländern.", desc_hu: "Tudósítások Európából.", cat: "news" },
    { start: "16:15", duration: 60, title_de: "Die Rosenheim-Cops", title_hu: "A bajor nyomozók", desc_de: "Krimi-Klassiker aus Bayern.", desc_hu: "Bajor krimisorozat.", cat: "series" },
    { start: "17:15", duration: 45, title_de: "hallo deutschland", title_hu: "Hello Németország", desc_de: "Menschliche Schicksale und Lifestyle.", desc_hu: "Életképek és érdekességek.", cat: "show" },
    { start: "18:00", duration: 60, title_de: "SOKO Köln", title_hu: "Kölni zsaruk", desc_de: "Kriminalfall in der Rheinmetropole.", desc_hu: "Kölni bűnügyi esetek.", cat: "series" },
    { start: "19:00", duration: 25, title_de: "heute 19:00 mit Wetter", title_hu: "ZDF Főhíradó és időjárás", desc_de: "Die Hauptnachrichten des ZDF.", desc_hu: "A ZDF esti híradója.", cat: "news" },
    { start: "19:25", duration: 50, title_de: "WISO - Verbrauchermagazin", title_hu: "Fogyasztóvédelmi magazin", desc_de: "Geld, Finanzen und Verbrauchertipps.", desc_hu: "Pénzügyek és hasznos tippek.", cat: "show" },
    { start: "20:15", duration: 90, title_de: "ZDF Fernsehfilm der Woche", title_hu: "A hét filmje", desc_de: "Großes Drama mit hochkarätiger Besetzung.", desc_hu: "Színvonalas játékfilm.", cat: "movies" },
    { start: "21:45", duration: 30, title_de: "heute-journal", title_hu: "Heute-Journal háttérműsor", desc_de: "Hintergründe, Kommentare und Interviews.", desc_hu: "Mélemzések és interjúk.", cat: "news" },
    { start: "22:15", duration: 45, title_de: "Maybrit Illner Talk", title_hu: "Politikai vitaest", desc_de: "Politischer Talk zu aktuellen Brennpunktthemen.", desc_hu: "Aktuális politikai fórum.", cat: "show" }
  ],
  // Hungarian Channels
  "duna": [
    { start: "06:00", duration: 180, title_de: "Család-barát Magazin", title_hu: "Család-barát Élő Magazin", desc_de: "Ungarisches Vormittagsmagazin mit Gästen und Kultur.", desc_hu: "Élő délelőtti magazinműsor sztárvendégekkel és receptekkel.", cat: "show" },
    { start: "09:00", duration: 60, title_de: "Alpensinfonie Dokumentation", title_hu: "Kárpát-medencei Természet", desc_de: "Wunderschöne Naturaufnahmen.", desc_hu: "Látványos természetfilm a Kárpátokról.", cat: "docs" },
    { start: "10:00", duration: 60, title_de: "Klasszikus Magyar Film", title_hu: "Klasszikus Magyar Játékfilm", desc_de: "Historische Filmwerke aus den Archiven.", desc_hu: "Klasszikus magyar filmalkotás archív kópiáról.", cat: "movies" },
    { start: "11:00", duration: 60, title_de: "Kékfény Kriminalmagazin", title_hu: "Kékfény Bűnügyi Magazin", desc_de: "Kriminalfälle und Gerichtsberichte.", desc_hu: "Bűnügyi krónika és rendőrségi hírek.", cat: "news" },
    { start: "12:00", duration: 45, title_de: "Déli Harangszó & Híradó", title_hu: "Déli Harangszó és Nemzeti Híradó", desc_de: "Mittagsläuten und aktuelle Nachrichten.", desc_hu: "A déli híradás összefoglalója.", cat: "news" },
    { start: "12:45", duration: 45, title_de: "Magyar Gazda és Vidék", title_hu: "Magyar Gazda Magazin", desc_de: "Landwirtschaft und Regionalberichte.", desc_hu: "Agrár- és vidéki életmód magazin.", cat: "docs" },
    { start: "13:30", duration: 60, title_de: "Szívtipró Telenovella", title_hu: "Délutáni Romantikus Sorozat", desc_de: "Dramatische Episoden.", desc_hu: "Romantikus délutáni folytatás.", cat: "series" },
    { start: "14:30", duration: 90, title_de: "Gasztroangyal Borbás Marcsival", title_hu: "Gasztroangyal válogatás", desc_de: "Traditionelle ungarische Rezepte und Reisen.", desc_hu: "Különleges tájak és receptek nyomában.", cat: "show" },
    { start: "16:00", duration: 60, title_de: "Ridikül Női Talkshow", title_hu: "Ridikül Beszélgetős Műsor", desc_de: "Lebendige Gesprächsrunde mit bekannten Frauen.", desc_hu: "Őszinte női beszélgetések ismert vendégekkel.", cat: "show" },
    { start: "17:00", duration: 60, title_de: "Klasszikus Nyomozók", title_hu: "Klasszikus Krimisorozat", desc_de: "Spannende Kriminalgeschichten.", desc_hu: "Rejtelmes bűnügyek kibogozása.", cat: "series" },
    { start: "18:00", duration: 60, title_de: "Duna Híradó 18:00", title_hu: "Duna Híradó és Sporthírek", desc_de: "Abendnachrichten und Sport aus Ungarn.", desc_hu: "A legfontosabb belföldi és külföldi hírek.", cat: "news" },
    { start: "19:00", duration: 75, title_de: "Magyarország, Szeretlek!", title_hu: "Magyarország, Szeretlek! Vetélkedő", desc_de: "Die beliebte TV-Show mit Musik und Quiz.", desc_hu: "Vidám családi vetélkedő sztárokkal és zenével.", cat: "show" },
    { start: "20:15", duration: 105, title_de: "Főműsoridős Magyar Film", title_hu: "Magyar Mozi: Liliomfi", desc_de: "Große ungarische Filmkomödie.", desc_hu: "Legendás magyar vígjáték digitálisan felújítva.", cat: "movies" },
    { start: "22:00", duration: 30, title_de: "Híradó Este & Kultúra", title_hu: "Késő Esti Híradó és Kultúra", desc_de: "Spätnachrichten.", desc_hu: "Késő esti összefoglaló.", cat: "news" }
  ],
  "m1": [
    { start: "00:00", duration: 60, title_de: "M1 Híradó 24 / 7 Élő", title_hu: "M1 Nemzeti Híradó Élő Adás", desc_de: "24-Stunden-Nachrichtenkanal mit Live-Schalten und Hintergrundberichten.", desc_hu: "Folyamatos élő hírfolyam, politikai és gazdasági háttérelemzések.", cat: "news" }
  ],
  "m4": [
    { start: "06:00", duration: 180, title_de: "M4 Sporthíradó Reggel", title_hu: "M4 Sporthíradó és Elemzések", desc_de: "Die sportlichen Höhepunkte des Vortags.", desc_hu: "A sportvilág reggeli összefoglalója.", cat: "sports" },
    { start: "09:00", duration: 120, title_de: "Bajnokok Ligája Összefoglaló", title_hu: "Labdarúgó Bajnokság Kiemelt Meccsek", desc_de: "Tore und Highlights der europäischen Ligen.", desc_hu: "Gólok és legjobb jelenetek.", cat: "sports" },
    { start: "11:00", duration: 60, title_de: "Kézilabda Magazin", title_hu: "Kézilabda Magazin és Élő Interjúk", desc_de: "Handball-Highlights.", desc_hu: "Magyar kézilabda hírek és interjúk.", cat: "sports" },
    { start: "12:00", duration: 30, title_de: "Déli Sporthírek", title_hu: "Déli Sporthíradó Élőben", desc_de: "Aktuelle Meldungen.", desc_hu: "Friss sporthírek.", cat: "sports" },
    { start: "12:30", duration: 150, title_de: "Magyar Labdarúgás Élő Meccs", title_hu: "NB I Bajnoki Labdarúgó Mérkőzés Élő", desc_de: "Direktübertragung aus der ungarischen Fußballliga.", desc_hu: "Élő bajnoki rangadó helyszíni közvetítéssel.", cat: "sports" },
    { start: "15:00", duration: 120, title_de: "Formel 1 Magazin & Elemzés", title_hu: "Forma 1 Boxutca Magazin", desc_de: "Hinter den Kulissen des Motorsports.", desc_hu: "Kulisszatitkok a száguldó cirkusz világából.", cat: "sports" },
    { start: "17:00", duration: 90, title_de: "Vízilabda Bajnokság Élő", title_hu: "Vízilabda Rangadó Élőben", desc_de: "Spitzensport im Wasser.", desc_hu: "Élő vízilabda mérkőzés.", cat: "sports" },
    { start: "18:30", duration: 45, title_de: "Esti Sporthíradó", title_hu: "Esti Sporthíradó és Eredmények", desc_de: "Alle Tabellen und Ergebnisse.", desc_hu: "A nap összes sporteredménye.", cat: "sports" },
    { start: "19:15", duration: 150, title_de: "Európai Bajnoki Labdarúgás Élő", title_hu: "Kiemelt Nemzetközi Labdarúgás Élő", desc_de: "Spitzenspiel des Abends.", desc_hu: "A forduló csúcsrangadója élőben.", cat: "sports" },
    { start: "21:45", duration: 60, title_de: "Góóól! Fordulóértékelő", title_hu: "Góóól! Elemző Műsor", desc_de: "Expertenrunde und Taktikanalyse.", desc_hu: "Szakértői stúdióbeszélgetés.", cat: "sports" }
  ]
};

class EPGManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Determine matching key in KNOWN_EPG_PROGRAMS
   */
  getChannelKey(channel) {
    const name = (channel.title_de || channel.title_hu || channel.name || '').toLowerCase();
    if (name.includes('tagesschau')) return 'tagesschau';
    if (name.includes('ard') || name.includes('das erste')) return 'ard';
    if (name.includes('zdf')) return 'zdf';
    if (name.includes('duna')) return 'duna';
    if (name.includes('m1') || name.includes('hirado')) return 'm1';
    if (name.includes('m4') || name.includes('sport')) return 'm4';
    return null;
  }

  /**
   * Get Schedule for a given channel for the current day
   */
  getChannelSchedule(channel, referenceDate = new Date()) {
    const key = this.getChannelKey(channel);
    if (key && KNOWN_EPG_PROGRAMS[key]) {
      return this.enrichScheduleWithDate(KNOWN_EPG_PROGRAMS[key], referenceDate);
    }
    // Generate dynamic realistic schedule for any M3U channel
    return this.generateDynamicSchedule(channel, referenceDate);
  }

  /**
   * Enrich static time strings (06:00, 20:00) with Date objects for today
   */
  enrichScheduleWithDate(programList, referenceDate) {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    return programList.map((prog, index) => {
      const [h, m] = prog.start.split(':').map(Number);
      const startObj = new Date(year, month, day, h, m, 0);
      const endObj = new Date(startObj.getTime() + (prog.duration * 60 * 1000));

      return {
        ...prog,
        id: `epg-${index}-${prog.start}`,
        startTime: startObj,
        endTime: endObj,
        startFormatted: this.formatTime(startObj),
        endFormatted: this.formatTime(endObj)
      };
    });
  }

  /**
   * Dynamically generate 24h slots for any unknown M3U channel
   */
  generateDynamicSchedule(channel, referenceDate) {
    const lang = channel.language || 'de';
    const isHu = lang === 'hu';
    const name = channel.title_de || channel.title_hu || 'Kanal';
    const isNews = /news|hír|nachrichten/i.test(name + ' ' + (channel.category || ''));
    const isSport = /sport/i.test(name + ' ' + (channel.category || ''));

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    const items = [];
    // Hourly slots from 00:00 to 23:00
    for (let hour = 6; hour < 24; hour += 2) {
      const startObj = new Date(year, month, day, hour, 0, 0);
      const endObj = new Date(year, month, day, hour + 2, 0, 0);
      
      let titleDe = `${name} - Magazin & Berichte`;
      let titleHu = `${name} - Magazin és Hírek`;
      let descDe = "Ausführliche Berichte und aktuelle Sendungen des Kanals.";
      let descHu = "Részletes tudósítások és aktuális adások a csatornán.";
      let cat = 'show';

      if (isNews) {
        titleDe = `Nachrichten & Live-Ticker ${hour}:00`;
        titleHu = `Élő Hírek és Tájékoztató ${hour}:00`;
        descDe = "Die wichtigsten Meldungen zur vollen Stunde.";
        descHu = "A legfontosabb hírek minden órában.";
        cat = 'news';
      } else if (isSport) {
        titleDe = `Sport-Highlights & Live-Sport ${hour}:00`;
        titleHu = `Élő Sportközvetítés és Összefoglaló`;
        descDe = "Beste Szenen, Vorberichte und Live-Sport.";
        descHu = "Legjobb sporteredmények és élő adás.";
        cat = 'sports';
      } else if (hour === 20) {
        titleDe = `Hauptprogramm 20:00: Spielfilm`;
        titleHu = `Esti Főműsoridő: Játékfilm`;
        descDe = "Spannender Filmabend zur besten Sendezeit.";
        descHu = "Esti film a legjobb műsoridőben.";
        cat = 'movies';
      }

      items.push({
        id: `dyn-${hour}`,
        title_de: titleDe,
        title_hu: titleHu,
        desc_de: descDe,
        desc_hu: descHu,
        cat: cat,
        duration: 120,
        startTime: startObj,
        endTime: endObj,
        startFormatted: this.formatTime(startObj),
        endFormatted: this.formatTime(endObj)
      });
    }

    return items;
  }

  /**
   * Get Current Show and Next Show for a channel right now
   */
  getCurrentAndNextShow(channel, now = new Date()) {
    const schedule = this.getChannelSchedule(channel, now);
    const nowTime = now.getTime();

    let currentShow = null;
    let nextShow = null;

    for (let i = 0; i < schedule.length; i++) {
      const prog = schedule[i];
      const start = prog.startTime.getTime();
      const end = prog.endTime.getTime();

      if (nowTime >= start && nowTime < end) {
        const totalDuration = end - start;
        const elapsed = nowTime - start;
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

        currentShow = {
          ...prog,
          progressPercent
        };
        nextShow = schedule[i + 1] || null;
        break;
      }
    }

    // Fallback if before first program or past last
    if (!currentShow && schedule.length > 0) {
      currentShow = {
        ...schedule[0],
        progressPercent: 40
      };
      nextShow = schedule[1] || null;
    }

    return {
      currentShow,
      nextShow,
      schedule
    };
  }

  formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

// Global singleton instance
window.epgManager = new EPGManager();

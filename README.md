# PrimeNexus Desktop Media Player (Windows)

Ein moderner, nativer Desktop-Player für Windows im Design von **Prime Video**, optimiert für **Serien, Spielfilme und Live TV**. Die Wiedergabe erfolgt direkt im integrierten nativen Video-Player ohne jeglichen Browser-Overhead oder Werbebanner.

---

## 🌟 Prime Video Streaming-Erlebnis

### 📺 1. Serien mit Staffeln & Episoden
- **Prime-Style Serien-Drawer:** Beim Anklicken einer Serie öffnet sich ein Episoden-Browser mit Serien-Backdrop, Staffelauswahl, Episoden-Vorschaubildern, Titeln, Beschreibungen und Laufzeiten.
- **Nächste Episode:** Im Player-Modus schaltet die Taste <kbd>N</kbd> (oder der Button *„Nächste Folge“*) nahtlos zur nächsten Episode der Serie weiter. Nach Ende einer Episode wird automatisch die nächste Episode gestartet.

### 🎬 2. Spielfilme & Klassiker
- **Kino-Erlebnis:** Direkte Wiedergabe von Langfilmen und gemeinfreien Filmklassikern (wie *Hyppolit, a lakáj (1931)* oder *A Noszty fiú esete Tóth Marival (1938)*).
- **Film-Metadaten:** IMDb-Bewertungen, Erscheinungsjahr, Laufzeit und Genre-Kategorien.

### 📡 3. Live TV, Sender-Nummerierung & TV-Programm (EPG)
- **Sortierung nach Sprachen:** TV-Sender sind übersichtlich nach Sprachen geordnet (🇩🇪 Deutsche Sender zuerst, 🇭🇺 Magyar adók an zweiter Stelle, gefolgt von 🌐 Internationalen Sendern).
- **Nummerierte Senderplätze (wie am Fernseher):** Jeder Sender besitzt eine feste Programmnummer (`CH 01`, `CH 02`...).
- **Zappen per Zifferntasten:** Während der Live-TV-Wiedergabe kann über die Tastatur mit den Tasten <kbd>1</kbd> bis <kbd>9</kbd> direkt zum entsprechenden Kanal geschaltet werden.
- **Live TV-Programm (EPG) auf jeder Senderkarte:**
  - `🔴 Jetzt läuft`: Aktuelle Sendung mit Sendezeit (z. B. 15:30 - 16:15) und Live-Fortschrittsbalken.
  - `⏱ Danach`: Die unmittelbar folgende Sendung mit Startzeit.
- **Elektronischer Programmführer (EPG Modal):** Über den Button **„📅 TV-Programm“** in der Kopfzeile lässt sich der komplette Tages-Sendeplan aller Sender öffnen und mit einem Klick direkt auf die gewünschte Sendung umschalten.
- **In-Player Senderliste (Zapper):** Während der Wiedergabe öffnet die Taste *„Senderliste“* eine Seitenleiste mit Sprachfiltern, Programmnummern und Live-Meldungen.

### 📦 4. Bibliotheken & Add-on System (Keine langen JSONs mehr!)
- **Ganze Seiten & Senderlisten per URL hinzufügen:** Statt mühsam riesige JSON-Dateien zu schreiben, gibst du einfach eine einzige M3U-Playlist-URL oder einen Remote-JSON-Katalog ein.
- **Automatischer M3U & IPTV Parser:** Liest Hunderte von TV-Sendern, Stream-URLs, Logos (`tvg-logo`), Senderkategorien (`group-title`) und Sendernamen automatisch ein.
- **1-Klick Katalog:** Vorkonfigurierte, legale Bibliotheken (wie öffentlich-rechtliche Sender für Deutschland & Ungarn) können mit einem einzigen Klick installiert und aktiviert werden.
- **Aktivieren / Deaktivieren & Synchronisieren:** Bibliotheken lassen sich jederzeit per Schiebeschalter an- und ausschalten oder per Sync-Knopf aktualisieren.

---

## 🎨 Prime Video Design Language

- **Kopfzeile:** Prime-typische Navigation mit Tabs: *Startseite*, *Filme*, *Serien*, *Live TV*.
- **Hero Billboard:** Großes Spotlight mit hochauflösendem Film-Backdrop, Prime-Badges (*PRIME EXKLUSIV*, *4K UHD*, *IMDb-Rating*), Kurzbeschreibung und Direktstart-Button.
- **Horizontale Rails (Carousels):** Sanft scrollende Schienen mit Navigationspfeilen für Serien, Filme, Live TV und Animation.
- **Mehrsprachig:** Vollständig zweisprachig auf **Deutsch (DE)** und **Ungarisch (HU)** mit sofortiger Umschaltung.

---

## ⌨️ Tastatur-Steuerung

| Taste | Funktion |
|---|---|
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause |
| <kbd>J</kbd> / <kbd>←</kbd> | 10 Sekunden zurückspringen |
| <kbd>L</kbd> / <kbd>→</kbd> | 10 Sekunden vorspringen |
| <kbd>N</kbd> | Nächste Episode abspielen (bei Serien) |
| <kbd>F</kbd> | Vollbildmodus an / aus |
| <kbd>M</kbd> | Stummschalten / Ton an |
| <kbd>P</kbd> | Bild-in-Bild (Picture-in-Picture) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Lautstärke regeln |

---

## 🚀 App starten

1. **Per Doppelklick:** Führe [`start-player.bat`](file:///c:/Users/Barnabas\Documents/player/start-player.bat) aus.
2. **Per Terminal:**
   ```powershell
   cd c:\Users\Barnabas\Documents\player
   npm start
   ```

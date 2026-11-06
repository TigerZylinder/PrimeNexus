# PrimeNexus SerienStream-Metadaten-Bridge

Diese kleine lokale .NET-8-Anwendung stellt SerienStreamAPI als JSON-Katalog für PrimeNexus bereit.

## Was sie macht

- Ruft Serien-Stammdaten ab.
- Lädt Episodentitel je Staffel.
- Gibt ein JSON-Format zurück, das PrimeNexus' `json_feed`-Addon lesen kann.
- Bindet den HTTP-Dienst ausschließlich an `127.0.0.1:4317`.

Die Bridge fragt **keine Video-Hoster-Seiten ab**, löst keine geschützten Stream-Adressen auf und liefert keine Wiedergabe-URLs. Die Einträge dienen daher zunächst als Serien-/Episoden-Metadatenkatalog. Für die Wiedergabe ist eine separate, autorisierte Medienquelle erforderlich.

## Voraussetzungen

- Windows oder ein anderes .NET-8-fähiges Betriebssystem
- .NET 8 SDK
- Netzwerkzugriff auf die konfigurierte Serien-Website
- PrimeNexus

## Starten

Im Ordner `tools/SerienStreamBridge`:

```bash
dotnet restore
dotnet run
```

Der Status-Endpunkt ist:

```
http://127.0.0.1:4317/health
```

## PrimeNexus-Addon hinzufügen

1. Starte die Bridge.
2. Öffne in PrimeNexus **Bibliotheken & Add-ons** → **Neue Bibliothek / Add-on**.
3. Name: zum Beispiel `Serien-Metadaten – My Series`.
4. Typ: **Remote JSON Catalog / Web-Feed**.
5. URL für eine Serie:

```
http://127.0.0.1:4317/catalog?title=My%20Series&site=serie
```

Für Anime:

```
http://127.0.0.1:4317/catalog?title=My%20Dress-Up%20Darling&site=anime
```

6. Sprache: Deutsch. Klicke auf **Bibliothek laden & aktivieren**.

Der Titel muss so geschrieben sein, dass ihn die zugrunde liegende SerienStreamAPI auf der ausgewählten Website findet. Leerzeichen und Sonderzeichen müssen URL-kodiert sein.

## Hinweise

- Die Bridge liefert jeweils einen Serien-Katalogeintrag pro Add-on-URL. Für mehrere Serien kannst du mehrere Add-ons anlegen.
- Wenn die Website ihre Seitenstruktur ändert, kann die zugrunde liegende Bibliothek vorübergehend keine Metadaten mehr auslesen.
- Die Bridge verwendet normale HTTPS-Zertifikatsprüfung.
- Bitte beachte Nutzungsbedingungen, Urheberrecht und lokale Gesetze. Nutze die Metadatenfunktion nur im rechtlich zulässigen Rahmen.

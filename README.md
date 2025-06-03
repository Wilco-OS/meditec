# Meditec Pulse Survey

Eine moderne Webanwendung zur Durchführung und Verwaltung von Umfragen für Unternehmen. Entwickelt mit Next.js, MongoDB und TypeScript.

## Funktionsumfang

- **Mehrere Benutzerrollen**: Meditec-Administratoren, Unternehmensadministratoren und Mitarbeiter
- **Unternehmensverwaltung**: Hinzufügen, Bearbeiten und Verwalten von Unternehmen
- **Benutzerverwaltung**: Benutzer je nach Rolle verwalten
- **Umfrageerstellung**: Erstellung und Verwaltung von Umfragen mit verschiedenen Fragetypen
- **Umfrageteilnahme**: Benutzerdefinierte Umfrageseiten für Teilnehmer
- **Auswertung**: Detaillierte Auswertung der Umfrageergebnisse

## Technische Details

- **Framework**: Next.js 13+ (App Router)
- **Datenbank**: MongoDB mit Mongoose ORM
- **Authentifizierung**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI-Komponenten**: Eigene UI-Komponenten-Bibliothek basierend auf Radix UI

## Inbetriebnahme

### Voraussetzungen

- Node.js 18 oder höher
- MongoDB-Zugang (Atlas oder lokale Instanz)
- NPM oder Yarn

### Installation

1. **Repository klonen**

```bash
git clone <repository-url>
cd meditec-pulse-survey
```

2. **Abhängigkeiten installieren**

```bash
npm install
# oder
yarn install
```

3. **Umgebungsvariablen konfigurieren**

Kopieren Sie die `.env.local.example` Datei zu `.env.local` und passen Sie die Werte an:

```bash
cp .env.local.example .env.local
```

Konfigurieren Sie mindestens folgende Variablen:

- `MONGODB_URI`: Verbindungs-URL für MongoDB
- `NEXTAUTH_SECRET`: Ein sicherer zufälliger String für die Verschlüsselung der Sitzungen
- `NEXTAUTH_URL`: Die vollständige URL Ihrer Anwendung (z.B. https://ihre-domain.de)
- `NODE_ENV`: Für Produktion auf "production" setzen

4. **Anwendung für Produktion bauen**

```bash
npm run build
# oder
yarn build
```

5. **Anwendung starten**

```bash
npm start
# oder
yarn start
```

### Ersteinrichtung

Bei der ersten Nutzung ist die Anwendung nicht mit Benutzern konfiguriert. Folgen Sie diesen Schritten:

1. Navigieren Sie zu `/setup` in Ihrem Browser
2. Erstellen Sie den ersten Admin-Benutzer mit einer E-Mail-Adresse der Domain `@meditec-online.com`
3. Nach erfolgreicher Erstellung werden Sie zur Anmeldeseite weitergeleitet
4. Melden Sie sich mit Ihren erstellten Zugangsdaten an

### Weitere Schritte nach der Ersteinrichtung

Als Meditec-Administrator können Sie:

1. Unternehmen hinzufügen
2. Administratoren für Unternehmen erstellen
3. Umfragen erstellen und Unternehmen zuweisen

Unternehmensadministratoren können dann:

1. Mitarbeiter zum System hinzufügen
2. Umfrageergebnisse ihrer Mitarbeiter einsehen

## Deployment

Die Anwendung kann auf verschiedenen Plattformen bereitgestellt werden:

- **Vercel**: Optimiert für Next.js-Anwendungen
- **Netlify**: Unterstützt auch Next.js-Anwendungen
- **Self-hosted**: Mit Node.js und PM2 oder Docker

### Wichtige Hinweise für die Produktion

1. Setzen Sie `NODE_ENV=production` für optimierte Builds
2. Konfigurieren Sie `NEXTAUTH_URL` auf Ihre tatsächliche Produktions-Domain
3. Verwenden Sie ein sicheres `NEXTAUTH_SECRET` (mindestens 32 Zeichen)
4. Stellen Sie sicher, dass Ihre MongoDB-Instanz entsprechend abgesichert ist

## Lizenz

© 2025 Meditec GmbH. Alle Rechte vorbehalten.

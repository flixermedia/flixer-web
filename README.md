<div align="center">

<img src="https://raw.githubusercontent.com/flixermedia/flixer/main/resources/logo/flixer-logo.png" alt="Flixer logo" width="112" />

# Flixer Web

**A cinematic interface for your own media.**

[![Stars](https://img.shields.io/github/stars/flixermedia/flixer-web?style=flat-square)](https://github.com/flixermedia/flixer-web/stargazers) [![Issues](https://img.shields.io/github/issues/flixermedia/flixer-web?style=flat-square)](https://github.com/flixermedia/flixer-web/issues)

[Flixer](https://github.com/flixermedia/flixer) · [Documentation](https://github.com/flixermedia/flixer-docs) · [Report an issue](https://github.com/flixermedia/flixer-web/issues)

</div>

---

> [!WARNING]
> **Under active development.** Flixer components and integration contracts may change. Check current source and release notes before upgrading production installations.

> [!NOTE]
> **Role in Flixer:** The Vue 3 application that powers browsing, sign-in, discovery, and playback interfaces. For an end-to-end deployment, start with the [Flixer backend repository](https://github.com/flixermedia/flixer).

## ✨ Features

- **Media discovery:** Browse titles, series, categories and search results.
- **Responsive experience:** Layouts for desktop, tablet and mobile, with glassmorphism styling.
- **Authentication:** Login, registration and protected routes backed by Flixer sessions.
- **Modern frontend:** Vue 3, Vite, Pinia, Vue Router and Tailwind CSS v4.
- **Mobile projects:** Capacitor wrappers for Android and iOS alongside the web build.

## 🏗️ Architecture

Flixer separates application logic from its web UI, media indexing, media delivery, update management, plugins and documentation. **Flixer Web** owns the following responsibility: the Vue 3 application that powers browsing, sign-in, discovery, and playback interfaces.

For the full platform, the API coordinates services; the browser interacts with the backend and the streamer receives authorised playback requests. Components should be operated as part of the supported Flixer stack unless you are developing or testing them directly.

## 🚀 Getting started

### Run locally

Requires Node.js (18+ recommended in the existing project guide) and npm.

```bash
git clone https://github.com/flixermedia/flixer-web.git
cd flixer-web
npm install
npm run dev
```

Open `http://localhost:5173`. Development API and streamer requests use same-origin Vite proxies, targeting `http://localhost:8083` and `http://localhost:8091` by default. Override those targets with `VITE_API_PROXY_TARGET` and `VITE_STREAMER_PROXY_TARGET` when the services are elsewhere.

### Native projects

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Android requires Android Studio/SDK; iOS requires macOS/Xcode. Native app setup asks users for an HTTPS Flixer server address. See the existing Capacitor configuration for platform-specific requirements.

## ⚙️ Configuration

| Setting | Role |
| --- | --- |
| `VITE_API_BASE_URL` | API prefix for non-development web builds; defaults to `/api`. |
| `VITE_API_PROXY_TARGET` | API target for the development proxy; defaults to `http://localhost:8083`. |
| `VITE_STREAMER_PROXY_TARGET` | Streamer target for development proxies; defaults to `http://localhost:8091`. |
| Native server address | HTTPS backend address saved by the mobile app after first launch. |

Browser sessions are checked against the API, with access tokens kept in session-scoped storage. Vite handles development proxying; the production Nginx proxy handles CORS for native WebView origins.

## 🧱 Technology

Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS v4 and Capacitor. See [`src/`](src/), [`android/`](android/), [`ios/`](ios/) (where present) and [`package.json`](package.json).

## 🧪 Checks

Run the repository's scripts defined in `package.json`; a [Vitest configuration](vitest.config.ts) is included.

## 🧩 Flixer ecosystem

| Repository | Purpose |
| --- | --- |
| [Flixer](https://github.com/flixermedia/flixer) | The self-hosted backend API, authentication, libraries, and administration service. |
| [Flixer Web](https://github.com/flixermedia/flixer-web) | The Vue 3 application that powers browsing, sign-in, discovery, and playback interfaces. |
| [Flixer Streamer](https://github.com/flixermedia/flixer-streamer) | The Go service responsible for authorised media delivery and FFmpeg processing. |
| [Flixer Indexer](https://github.com/flixermedia/flixer-indexer) | The Go worker and API service for discovering, identifying, probing, and enriching media. |
| [Flixer Updater](https://github.com/flixermedia/flixer-updater) | The Go sidecar that orchestrates Docker Compose updates and restores. |
| [Flixer Plugins](https://github.com/flixermedia/flixer-plugins) | The official versioned catalogue of Flixer plugins and plugin schemas. |
| [Flixer Docs](https://github.com/flixermedia/flixer-docs) | The Docusaurus source for Flixer platform documentation. |

## 🤝 Contributing

Contributions, bug reports and documentation improvements are welcome. Open an [issue](https://github.com/flixermedia/flixer-web/issues) with reproduction steps or a focused proposal, then submit a pull request against the repository. Keep configuration, examples and documentation aligned with implemented code. For backend contributions, also see the [main contribution guidelines](https://github.com/flixermedia/flixer/blob/main/CONTRIBUTING.md).

## 📄 Licence

Check this repository's [`LICENSE`](LICENSE) file, if present, for the authoritative licensing terms. The [main Flixer backend](https://github.com/flixermedia/flixer/blob/main/LICENSE) uses MIT; licensing for separate components should be verified individually before redistribution.

---

<div align="center">

**Your media. Your server. Your rules.**

Made for the [Flixer](https://github.com/flixermedia) ecosystem.

</div>

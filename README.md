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
- **Page builder:** Administrators can design browser sign-in and standalone pages with draggable blocks, responsive positions, drafts and version history. TV sign-in keeps its own layout.
- **Payments:** Optional paywalls, rentals, purchases and subscriptions with an embedded Stripe or Square card form, a billing page and an admin Payments section. Off unless an admin enables it.
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

The generated Flixer API client is published publicly to npm; once its first npm release is available, no registry token is needed to install dependencies.

Open `http://localhost:5173`. Development API and streamer requests use same-origin Vite proxies, targeting `http://localhost:8083` and `http://localhost:8091` by default. Override those targets with `VITE_API_PROXY_TARGET` and `VITE_STREAMER_PROXY_TARGET` when the services are elsewhere.

### Native projects

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Android requires Android Studio/SDK; iOS requires macOS/Xcode. Native app setup asks users for an HTTPS Flixer server address. See the existing Capacitor configuration for platform-specific requirements.

Native builds use the packaged web interface by default. For development live reload, set `CAPACITOR_LIVE_URL` before syncing the native project.

On Capacitor, Flixer-served library and person artwork is kept in a bounded private cache across app restarts. The server verifies access and freshness before cached artwork is used; offline or denied checks cannot use the cached image. The cache is cleared on sign-out, account or server changes. Images larger than 1 MiB are not persisted. External images follow their providers' caching policies; authenticated plugin-catalog images are requested without native caching so access is checked again. Persistent artwork caching requires a Flixer server that supports revalidation.

For Android TV, run `npm run cap:android:tv` to build the separate debug APK at `android/tv/build/outputs/apk/debug/tv-debug.apk`. Install it on an authorized TV device with `adb install -r android/tv/build/outputs/apk/debug/tv-debug.apk`. The TV application ID is `com.flixermedia.flixer.tv`; the mobile Android app is unchanged. The build uses the server URL configured in `capacitor.config.ts`.

In TV mode, video playback opens on a dedicated player page using Flixer's custom controls for movies, episodes, streamed trailers and live TV. Back returns to the previous page; the mini-player remains available only outside TV mode. On mobile, ad-free on-demand video continues to use the native player.

TV mode offers username and password sign-in, or a QR code for signing in or registering on a phone. Phone sign-in supports the phone's passkeys and external providers; the signed-in user must approve the matching Quick Connect code before the TV signs in. If a password requires a passkey, sign in fully on the phone and approve the TV instead. Quick Connect must be enabled by the server administrator for phone sign-in. The server must provide its public application URL (`APP_URL`, or `FLIXER_PUBLIC_URL`) for native TV QR codes, and the phone must be able to reach it. Codes expire after five minutes; if verification or payment takes longer, request a new code and scan it again.

On the TV server-connection screen, phone setup is available as a local alternative to entering the address with the remote. Open this Flixer server's `/quick-setup` route on the phone, scan the TV code, and confirm the server address. The phone and TV must be on the same local network; the pairing listener uses a one-time code and expires after five minutes. After setup, the phone opens `/quick-connect`, where a signed-in user can scan the TV's sign-in QR code or enter its code manually, then approve the request. This flow does not use a cloud relay.

TV mode hides casting, Up Next management, adding to collections, issue reporting, watch-party joining, manual watched status and media editing, including subtitle and chapter management. Subtitle selection remains available in the player.

TV mode fits a fixed 1280×720 layout to the available viewport, with black bars when needed. It blocks browser zoom shortcuts and zoom gestures when the browser allows it; browser menus, extensions and settings may still change zoom.

### Page builder

Open **Admin → Settings → Appearance → Custom** to edit the browser sign-in page or create other pages. Publishing the login design selects it for browser sign-in; the built-in authentication checks remain in effect. Existing flow layouts remain available, and dragging an element switches the draft to free positioning. Desktop and mobile positions are edited separately.

Standalone pages can be public or restricted to signed-in users. Published pages can be added to navigation or selected as the signed-in home page. Drafts are private to administrators; publishing creates a restorable version, and scheduled publications run through the server scheduler. Unpublished pages are not accessible to visitors.

Custom registration fields are optional and stored privately with the user's account. Custom form actions accept only same-origin paths and send only explicitly selected custom fields, without passwords, passkeys, session tokens or cookies. Do not collect sensitive information in custom fields.

## ⚙️ Configuration

| Setting                      | Role                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`          | API prefix for non-development web builds; defaults to `/api`.                |
| `VITE_API_PROXY_TARGET`      | API target for the development proxy; defaults to `http://localhost:8083`.    |
| `VITE_STREAMER_PROXY_TARGET` | Streamer target for development proxies; defaults to `http://localhost:8091`. |
| Native server address        | HTTPS backend address saved by the mobile app after first launch.             |

Browser sessions are checked against the API, with access tokens kept in session-scoped storage. Vite handles development proxying; the production Nginx proxy handles CORS for native WebView origins.

## 🧱 Technology

Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS v4 and Capacitor. See [`src/`](src/), [`android/`](android/), [`ios/`](ios/) (where present) and [`package.json`](package.json).

## 🧪 Checks

Run the repository's scripts defined in `package.json`; a [Vitest configuration](vitest.config.ts) is included.

### Promotional screenshots

With Flixer Web and its API running, use Node.js 22.6 or newer and install Chromium once with `npx playwright install chromium` (add `--with-deps` on Linux if system libraries are missing). Capture the main pages, settings tabs and every admin dashboard page with:

```sh
export FLIXER_URL="http://localhost:5173"
export FLIXER_ADMIN_USERNAME="your-admin"
read -rs -p "Admin password: " FLIXER_ADMIN_PASSWORD; echo
export FLIXER_ADMIN_PASSWORD
npm run screenshots
unset FLIXER_ADMIN_PASSWORD
```

Alternatively, unset both credential variables, run `npm run screenshots -- --url http://localhost:5173 --headed`, and sign in manually in the browser, including any passkey verification. The browser session is temporary and is not saved. Password authentication may require `--headed` when a passkey is required.

The script captures the sign-in page before credentials are entered, then the main routes, settings tabs and admin pages. It captures up to three discovered media, person, playlist, profile, request and plugin pages per type; only links present in the loaded pages can be discovered. Use `--max-per-type 0` to disable discovery, or repeat `--path /media/ID` to add specific pages. Player, invitation, setup and passkey callback routes are not visited automatically. Run `npm run screenshots -- --help` for viewport, full-page, output directory and loading-delay options. Screenshots and `manifest.json` are written to a new run directory under the Git-ignored `screenshots/` directory by default, so runs do not overwrite each other. Failed pages are listed in the manifest and cause a nonzero exit code; optional unavailable settings tabs are marked as skipped.

The capture tool applies opaque redaction (rather than reversible blur) to text inputs, textareas, selects, detected URLs, domains, email addresses, IPs, filesystem paths and token-like strings. It also masks admin list/table data, avatar menus, embedded content and especially private areas such as chat and profile settings. Add repeatable `--mask-selector 'CSS selector'` arguments or mark elements with `data-screenshot-sensitive` to hide more content. For example, `npm run screenshots -- --mask-selector '.personal-details' --mask-selector '#private-banner'` masks both elements wherever they appear. New manifests omit the server address and page paths.

**Review everything before publishing.** Automatic redaction is best effort, not a guarantee: unrecognized secrets, personal details, content rendered in images or unusual layouts, and licensed artwork may remain visible. Use a dedicated demo server and account with content you have permission to publish. Normal page visits can still trigger application activity such as read receipts. Existing screenshot runs and their manifests are not modified; delete or recapture them yourself if they contain sensitive information.

Run the script's tests with `npm run test:screenshots`.

## 📚 Storybook

Browse and develop reusable components in isolation with [Storybook for Vue 3 + Vite](https://storybook.js.org/docs/get-started/frameworks/vue3-vite):

```sh
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static build in storybook-static/
```

- Put a `<Component>.stories.ts` file next to each component (see [`src/components/ui/`](src/components/ui/)); the `.storybook/` config picks up every `src/**/*.stories.ts`.
- Components should take data through props and emit events rather than calling the API directly. [`.storybook/preview.ts`](.storybook/preview.ts) provides i18n (English), vue-router (memory history), vue-modal, toasts, the `Icon` component, Tailwind and a dark/light theme toggle.
- Every exported function in `src/api/*.ts` is replaced by a spy in Storybook (see `.storybook/main.ts`), so nothing reaches the network. Give them values in a story's `beforeEach`, e.g. `mocked(getFavoriteIds).mockResolvedValue({ ids: [] })` (`mocked` from `storybook/test`).
- Modal components are rendered with `render: (args) => modalStory(Component, args)()` from [`src/storybook/modalStory.ts`](src/storybook/modalStory.ts). Shared fixture data lives in [`src/storybook/`](src/storybook/).
- Every component under `src/components/` has a story except `player/NativeVideoPlayer.vue`, which only drives a native Capacitor plugin and renders nothing in a browser.

### Testing stories

- `npm test` runs the unit tests.
- `npm run test-storybook` runs every story as a test (smoke render, `play` interactions and a11y checks) in headless Chromium via `@storybook/addon-vitest`. On a fresh machine run `npx playwright install chromium --with-deps` first.
- `npm run coverage` runs the unit tests and story tests together with a v8 coverage report (`coverage/`). Running all stories from the Storybook testing widget with **Coverage** ticked can run out of memory at the final step ("Connection lost" at 526/527, heap exhausted while receiving the results); untick Coverage in the widget and use `npm run coverage` instead. Watermarks are set in `vitest.config.ts`.
- Use the Viewport toolbar to check responsive layouts; a11y results show in the Accessibility panel (`parameters.a11y.test` is `todo`, so violations are reported but do not fail tests; set it to `error` in `.storybook/preview.ts` once they are fixed). With `error`, 72 of 527 stories currently fail, mainly `listitem`/`aria-required-parent`, `label-content-name-mismatch`, `color-contrast`, `empty-table-header`, `aria-progressbar-name` and `select-name`.
- CI (`.github/workflows/storybook.yml`) runs both and uploads the built Storybook as an artifact.

## 🧩 Flixer ecosystem

| Repository                                                        | Purpose                                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [Flixer](https://github.com/flixermedia/flixer)                   | The self-hosted backend API, authentication, libraries, and administration service.       |
| [Flixer Web](https://github.com/flixermedia/flixer-web)           | The Vue 3 application that powers browsing, sign-in, discovery, and playback interfaces.  |
| [Flixer Streamer](https://github.com/flixermedia/flixer-streamer) | The Go service responsible for authorised media delivery and FFmpeg processing.           |
| [Flixer Indexer](https://github.com/flixermedia/flixer-indexer)   | The Go worker and API service for discovering, identifying, probing, and enriching media. |
| [Flixer Updater](https://github.com/flixermedia/flixer-updater)   | The Go sidecar that orchestrates Docker Compose updates and restores.                     |
| [Flixer Plugins](https://github.com/flixermedia/flixer-plugins)   | The official versioned catalogue of Flixer plugins and plugin schemas.                    |
| [Flixer Docs](https://github.com/flixermedia/flixer-docs)         | The Docusaurus source for Flixer platform documentation.                                  |

## 🤝 Contributing

Contributions, bug reports and documentation improvements are welcome. Open an [issue](https://github.com/flixermedia/flixer-web/issues) with reproduction steps or a focused proposal, then submit a pull request against the repository. Keep configuration, examples and documentation aligned with implemented code. For backend contributions, also see the [main contribution guidelines](https://github.com/flixermedia/flixer/blob/main/CONTRIBUTING.md).

## 📄 Licence

Check this repository's [`LICENSE`](LICENSE) file, if present, for the authoritative licensing terms. The [main Flixer backend](https://github.com/flixermedia/flixer/blob/main/LICENSE) uses MIT; licensing for separate components should be verified individually before redistribution.

---

<div align="center">

**Your media. Your server. Your rules.**

Made for the [Flixer](https://github.com/flixermedia) ecosystem.

</div>

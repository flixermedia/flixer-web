# Translating Flixer

Flixer Web uses [vue-i18n](https://vue-i18n.intlify.dev/). Translations are managed on [Weblate](https://weblate.org/) and synced with GitHub.

## For translators

1. Open the Flixer project on Weblate and pick your language (or start a new one).
2. Translate strings in the web UI. Keep `{placeholders}` exactly as written, e.g. `Hello {name}`.
3. Weblate commits to the repository (or opens a pull request). A GitHub check validates the files.

Plurals use vue-i18n's pipe syntax: `"no items | one item | {count} items"`.

## Weblate component settings

| Setting | Value |
| --- | --- |
| File format | JSON nested structure file |
| File mask | `src/locales/*.json` |
| Monolingual base language file | `src/locales/en.json` |
| Template for new translations | `src/locales/en.json` |
| Translation flags | `icu-message-format` is **not** used; leave blank |
| Language code style | BCP47 (`pt-BR`), matching file names |
| Repository | the GitHub repo; enable the GitHub pull request push method, or the Weblate GitHub webhook for incoming changes |

Add the Weblate webhook (`https://<weblate-host>/hooks/github/`) to the GitHub repository so source-string changes appear on Weblate immediately.

## For developers

- `src/locales/en.json` is the only file developers edit; never edit other locale files by hand.
- Use nested, descriptive keys (`settings.tabs.profile`) and `{named}` placeholders, never string concatenation.
- In templates: `{{ t('settings.title') }}` with `const { t } = useI18n()`. Outside components: `i18n.global.t(...)`.
- Adding a language only needs a new `src/locales/<code>.json`; it is detected, lazy-loaded and offered in Settings → Language. Missing keys fall back to English.
- Run `npm run i18n:check` to validate locale files.

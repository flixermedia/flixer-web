# Flixer Web brand and theme

Flixer uses a dark, cinematic interface with translucent charcoal surfaces, a violet-to-indigo brand gradient, and restrained cyan-teal highlights. The theme is defined in [`src/tailwind.css`](../src/tailwind.css) and applied with Tailwind CSS utilities; use the existing tokens rather than introducing one-off colors or component styles.

The native launch-screen artwork is maintained in [`splash/flixer-splash.svg`](splash/flixer-splash.svg) and rasterized into the iOS and Android asset catalogs.
The homescreen app icon uses [`logo/flixer-app-icon.svg`](logo/flixer-app-icon.svg) as its opaque, square source artwork.

## Visual direction

- **Cinematic and focused:** near-black page backgrounds keep attention on media and account tasks.
- **Violet and indigo:** the primary gradient identifies Flixer actions and brand marks.
- **Quiet supporting colors:** muted text and subtle borders establish hierarchy without competing with content.
- **Glass surfaces:** over media artwork, use translucent dark surfaces, fine borders, and Tailwind backdrop-blur utilities while preserving contrast.
- **Cyan-teal as a highlight:** use sparingly for decorative details and selected accents.
- **Responsive by default:** compose layouts from mobile-first Tailwind utilities and standard breakpoints.

## Theme palette

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Page background | `flixer-background` | `#080811` | Application canvas |
| Surface | `flixer-surface` | `#14131D` | Cards, form fields, and raised panels |
| Border | `flixer-border` | `#292735` | Subtle dividers and control outlines |
| Primary | `flixer-primary` | `#7645D7` | Primary actions and brand gradient start |
| Secondary | `flixer-secondary` | `#5366E7` | Brand gradient end and secondary emphasis |
| Accent | `flixer-accent` | `#A789FF` | Focus indicators, highlights, and small accents |
| Cyan | `flixer-cyan` | `#4BD9E8` | Occasional decorative highlights |
| Main text | `flixer-text` | `#F4F2FB` | Headings and primary content |
| Muted text | `flixer-muted` | `#9492A4` | Supporting copy, labels, and metadata |

## Tailwind usage

The project uses Tailwind CSS v4 with its Vite plugin. Its `@theme` block in `src/tailwind.css` generates the `bg-flixer-*`, `text-flixer-*`, `border-flixer-*`, and related utilities. Prefer those utilities and existing Tailwind patterns for layout, states, and responsive behavior.

Use the primary and secondary tokens for the standard brand gradient:

```html
<button class="bg-gradient-to-r from-flixer-primary to-flixer-secondary text-white">
  Continue
</button>
```

Keep custom CSS to cases that cannot reasonably be expressed with Tailwind utilities. Tailwind Plus (formerly Tailwind UI) components and patterns may be adapted to the project’s tokens; they do not require a separate runtime styling framework.

## Typography and accessibility

- Use the `font-sans` utility for the system UI stack defined by the theme.
- Use `text-flixer-text` for primary content and `text-flixer-muted` for secondary content.
- Keep focus indicators visible with the accent color, and retain clear hover, disabled, and loading states.
- Use semantic elements and maintain readable contrast on dark surfaces.

## Component reuse

Prefer shared Vue components for repeated interface patterns. The sign-in and registration views share `AuthField.vue`; keep field behavior and presentation consistent there, while composing each form from Tailwind utilities and slots.

import type { FeaturedItem, MediaItem, NavTab } from '../types/media'

const imageUrls = import.meta.glob('../../resources/images/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function imagesIn(folder: string) {
  return Object.entries(imageUrls)
    .filter(([path]) => path.includes(`/${folder}/`))
    .map(([, url]) => url)
}

const banners = imagesIn('Carousel Banners')
const posters = imagesIn('Movie Posters')
const pick = (list: string[], index: number) => list[index % list.length]

const featuredTitles = ['Midnight Run', 'Galaxy Odyssey', 'Nebula', 'The Sun', 'The Colons']

export const featuredItems: FeaturedItem[] = banners.map((image, index) => ({
  title: featuredTitles[index % featuredTitles.length],
  tagline: index % 2 === 0 ? 'Movie' : 'Season 1 · Episode 1',
  year: 2018 + index,
  rating: index % 2 === 0 ? '15' : 'TV-14',
  runtime: `${95 + index * 9}m`,
  description: 'Placeholder synopsis. Real metadata will replace this once the library is connected.',
  image,
}))

export const continueWatching: MediaItem[] = ['Galaxy Odyssey', 'Nebula', 'The Sun', 'The Colons', 'Sanctphone', 'The World'].map(
  (title, index) => ({
    title,
    subtitle: index % 2 === 0 ? 'S1 · E3' : `${40 + index * 10} min left`,
    image: pick(banners, index),
    progress: [70, 55, 65, 80, 45, 30][index],
  }),
)

export const nextUp: MediaItem[] = ['The Colons', 'Sanctphone', 'Nebula', 'The World', 'Galaxy Odyssey'].map((title, index) => ({
  title,
  subtitle: `S1 · E${index + 2}`,
  image: pick(banners, index + 2),
}))

export const libraries: MediaItem[] = [
  { title: 'Movies', image: pick(banners, 0) },
  { title: 'TV Shows', image: pick(banners, 1) },
  { title: 'Music', image: pick(banners, 3) },
]

export const latestMovies: MediaItem[] = Array.from({ length: 10 }, (_, index) => ({
  title: `Movie ${index + 1}`,
  subtitle: `${2024 - (index % 6)}`,
  image: pick(posters, index),
}))

export const latestShows: MediaItem[] = Array.from({ length: 10 }, (_, index) => ({
  title: `TV Show ${index + 1}`,
  subtitle: `${2025 - (index % 5)}`,
  image: pick(posters, index + 1),
}))

export const navLinks = ['Home', 'Movies', 'TV Shows', 'Music', 'Request Content']

export const mobileTabs: NavTab[] = [
  { label: 'Home', icon: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z' },
  { label: 'Movies', icon: 'M4 5h16v14H4zM4 9h16M8 5l-2 4m6-4l-2 4m6-4l-2 4' },
  { label: 'TV', icon: 'M3 6h18v12H3zM8 21h8' },
  { label: 'Music', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { label: 'Search', icon: 'M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z' },
]

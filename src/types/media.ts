export interface FeaturedItem {
  title: string
  tagline: string
  year: number
  rating: string
  runtime: string
  description: string
  image: string
}

export interface MediaItem {
  title: string
  image: string
  subtitle?: string
  progress?: number
}

export interface NavTab {
  label: string
  icon: string
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFavorites } from './useFavorites'

const { getFavoriteIds, addFavorite, removeFavorite } = vi.hoisted(() => ({
  getFavoriteIds: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))
vi.mock('../api', () => ({ getFavoriteIds, addFavorite, removeFavorite }))

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getFavoriteIds.mockResolvedValue({ ids: ['saved'] })
    addFavorite.mockResolvedValue(undefined)
    removeFavorite.mockResolvedValue(undefined)
  })

  it('loads favorite ids once across composable consumers', async () => {
    const first = useFavorites()
    const second = useFavorites()
    await Promise.all([first.load(), second.load()])
    expect(getFavoriteIds).toHaveBeenCalledTimes(1)
    expect(second.isFavorite('saved')).toBe(true)
  })

  it('updates optimistically and rolls back when the API fails', async () => {
    const favorites = useFavorites()
    await favorites.load()
    addFavorite.mockRejectedValueOnce(new Error('network'))
    const pending = favorites.toggle('new')
    expect(favorites.isFavorite('new')).toBe(true)
    await expect(pending).rejects.toThrow('network')
    expect(favorites.isFavorite('new')).toBe(false)
  })

  it('removes an existing favorite through the API', async () => {
    const favorites = useFavorites()
    await favorites.load()
    await favorites.toggle('saved')
    expect(removeFavorite).toHaveBeenCalledWith('saved')
    expect(favorites.isFavorite('saved')).toBe(false)
  })
})

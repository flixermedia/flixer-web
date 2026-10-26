import { ref } from 'vue'
import { addFavorite, getFavoriteIds, removeFavorite } from '../api'

const favoriteIds = ref<Set<string>>(new Set())
let loadPromise: Promise<void> | null = null
const revisions = new Map<string, number>()
const operations = new Map<string, Promise<void>>()

async function load(): Promise<void> {
  if (!loadPromise) {
    loadPromise = getFavoriteIds()
      .then(({ ids }) => {
        favoriteIds.value = new Set(ids)
      })
      .catch((error: unknown) => {
        loadPromise = null
        throw error
      })
  }
  return loadPromise
}

async function toggle(itemId: string): Promise<void> {
  const wasFavorite = favoriteIds.value.has(itemId)
  const shouldFavorite = !wasFavorite
  const revision = (revisions.get(itemId) ?? 0) + 1
  revisions.set(itemId, revision)
  const next = new Set(favoriteIds.value)
  if (shouldFavorite) next.add(itemId)
  else next.delete(itemId)
  favoriteIds.value = next

  const previous = operations.get(itemId) ?? Promise.resolve()
  const operation = previous
    .catch(() => undefined)
    .then(async () => {
      try {
        if (shouldFavorite) await addFavorite(itemId)
        else await removeFavorite(itemId)
      } catch (error) {
        if (revisions.get(itemId) === revision) {
          const rolledBack = new Set(favoriteIds.value)
          if (wasFavorite) rolledBack.add(itemId)
          else rolledBack.delete(itemId)
          favoriteIds.value = rolledBack
        }
        throw error
      }
    })
  operations.set(itemId, operation)
  try {
    await operation
  } finally {
    if (operations.get(itemId) === operation) operations.delete(itemId)
  }
}

export function useFavorites() {
  return { favoriteIds, load, toggle, isFavorite: (itemId: string) => favoriteIds.value.has(itemId) }
}

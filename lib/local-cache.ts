import type { Exercise } from './types'

const DB_NAME = 'ru_coach_local_db'
const DB_VERSION = 1
const EXERCISES_STORE = 'exercises'
const METADATA_STORE = 'metadata'

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
          db.createObjectStore(EXERCISES_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Obtiene todos los ejercicios cacheados en IndexedDB
 */
export async function getCachedExercises(): Promise<Exercise[] | null> {
  const db = await openDB()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([EXERCISES_STORE, METADATA_STORE], 'readonly')
      const store = tx.objectStore(EXERCISES_STORE)
      const req = store.getAll()

      req.onsuccess = () => {
        const items = req.result as Exercise[]
        if (Array.isArray(items) && items.length > 0) {
          resolve(items)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Guarda en masa los ejercicios en IndexedDB
 */
export async function setCachedExercises(exercises: Exercise[]): Promise<boolean> {
  if (!Array.isArray(exercises) || exercises.length === 0) return false
  const db = await openDB()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([EXERCISES_STORE, METADATA_STORE], 'readwrite')
      const exStore = tx.objectStore(EXERCISES_STORE)
      const metaStore = tx.objectStore(METADATA_STORE)

      // Limpiar y repoblar para garantizar coherencia
      exStore.clear()
      for (const ex of exercises) {
        exStore.put(ex)
      }

      metaStore.put({
        key: 'exercises_meta',
        count: exercises.length,
        saved_at: Date.now(),
      })

      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

/**
 * Limpia la caché local de ejercicios
 */
export async function clearCachedExercises(): Promise<void> {
  const db = await openDB()
  if (!db) return

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([EXERCISES_STORE, METADATA_STORE], 'readwrite')
      tx.objectStore(EXERCISES_STORE).clear()
      tx.objectStore(METADATA_STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}


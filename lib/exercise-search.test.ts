import { describe, it, expect } from 'vitest'
import {
  editDistance,
  searchExercises,
  findSimilarExercises,
  normalizeSearchText,
} from './exercise-search'
import type { Exercise } from '@/lib/types'

describe('exercise-search engine', () => {
  it('calculates Damerau-Levenshtein edit distance correctly', () => {
    expect(editDistance('bench', 'bnech', 2)).toBe(1) // adjacent transposition
    expect(editDistance('squat', 'sqat', 2)).toBe(1) // deletion
    expect(editDistance('curl', 'curr', 2)).toBe(1) // substitution
    expect(editDistance('press', 'press', 2)).toBe(0) // exact
    expect(editDistance('barbell', 'dumbbell', 1)).toBeGreaterThan(1)
  })

  it('normalizes search text and strips diacritics', () => {
    expect(normalizeSearchText('Extensión de Cuádriceps')).toBe(
      'extension de cuadriceps',
    )
  })

  const mockExercises: Partial<Exercise>[] = [
    {
      id: '0025',
      name: 'barbell bench press',
      name_es: 'Press de banca con barra',
      primary_muscle: 'chest',
      equipment: 'barbell',
      body_part: 'chest',
    },
    {
      id: '0289',
      name: 'dumbbell bench press',
      name_es: 'Press de banca con mancuernas',
      primary_muscle: 'chest',
      equipment: 'dumbbell',
      body_part: 'chest',
    },
    {
      id: '0043',
      name: 'barbell full squat',
      name_es: 'Sentadilla profunda con barra',
      primary_muscle: 'quadriceps',
      equipment: 'barbell',
      body_part: 'upper legs',
    },
    {
      id: '0032',
      name: 'barbell deadlift',
      name_es: 'Peso muerto con barra',
      primary_muscle: 'glutes',
      equipment: 'barbell',
      body_part: 'upper legs',
    },
  ]

  it('matches via bilingual synonyms (ES <-> EN and gym shorthand)', () => {
    // "sentadilla" finds barbell full squat
    const squatResults = searchExercises(mockExercises, 'sentadilla')
    expect(squatResults.length).toBeGreaterThan(0)
    expect(squatResults[0].id).toBe('0043')

    // "bp" finds bench presses
    const bpResults = searchExercises(mockExercises, 'bp')
    expect(bpResults.length).toBe(2)

    // "mancuerna" finds dumbbell bench press
    const dbResults = searchExercises(mockExercises, 'mancuerna')
    expect(dbResults.length).toBe(1)
    expect(dbResults[0].id).toBe('0289')
  })

  it('handles typos with Damerau-Levenshtein distance', () => {
    // "bnech" finds bench press
    const typoResults = searchExercises(mockExercises, 'bnech')
    expect(typoResults.length).toBe(2)

    // "dumbell" finds dumbbell bench press
    const typoDbResults = searchExercises(mockExercises, 'dumbell')
    expect(typoDbResults.length).toBe(1)
    expect(typoDbResults[0].id).toBe('0289')
  })

  it('finds similar exercises based on muscle and equipment', () => {
    const target = mockExercises[0] // barbell bench press (chest, barbell)
    const similar = findSimilarExercises(target, mockExercises)

    expect(similar.length).toBe(1)
    expect(similar[0].id).toBe('0289') // dumbbell bench press
  })
})

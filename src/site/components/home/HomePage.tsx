import { useState } from 'react'
import { HeroFilm } from './HeroFilm'
import { Shelves } from './Shelves'
import { SkillInstall } from './SkillInstall'

export function HomePage() {
  // The search lives in the hero and filters the grid in Shelves. Setting `loaded` re-renders Shelves once the haystack chunk is in.
  const [query, setQuery] = useState('')
  const [, setLoaded] = useState(false)
  return (
    <main>
      <HeroFilm query={query} onQuery={setQuery} onLoaded={() => setLoaded(true)} />
      <Shelves query={query} onQuery={setQuery} />
      <SkillInstall />
    </main>
  )
}

// JSON-driven pages with one text block per language: content/alternatives/<slug>.json, content/use-cases/<slug>.json,
// content/gallery/<slug>.json and content/changelog/changelog.json, one lazy chunk per file. Whether a page exists in a
// language is decided by the registry (`isSitePage`); the route loaders check it before they read the file.
import type { AlternativesFile, ChangelogFile, GalleryFile, UseCaseFile } from './schema'

type Files = { alternatives: AlternativesFile; 'use-cases': UseCaseFile; gallery: GalleryFile; changelog: ChangelogFile }

const files = import.meta.glob<unknown>('/content/{alternatives,use-cases,gallery,changelog}/*.json', { import: 'default' })

/** The parsed file of a page (every language), or undefined when there is none. */
export async function loadPageFile<K extends keyof Files>(dir: K, slug: string): Promise<Files[K] | undefined> {
  return (await files[`/content/${dir}/${slug}.json`]?.()) as Files[K] | undefined
}

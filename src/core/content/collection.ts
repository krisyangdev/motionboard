// One collection's items, loaded on demand: the item and hub pages of that collection import it, every other page never does.
import collections from 'virtual:content-collections'
import type { ItemIndexEntry } from '../pages'
import type { ItemFile } from './schema'

export type CollectionModule = { items: ItemIndexEntry[]; files: Record<string, () => Promise<ItemFile>> }

export const loadCollection = async (id: string): Promise<CollectionModule | undefined> => collections[id]?.()

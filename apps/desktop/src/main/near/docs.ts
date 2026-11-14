// NEAR's documentation and the NEAR Intents docs, bundled with the app by
// scripts/fetch-near-docs.mjs, so agents can search and read them offline
import { readFile } from 'node:fs/promises'
import { dirname, join, normalize, sep } from 'node:path'
import docsIndex from '../../../resources/near-docs/index.json?asset'

type Page = {
  // A source id from index.json, e.g. near, intents
  source: string
  section: string
  title: string
  description: string
  file: string
  url: string
  bytes: number
}

type Loaded = Page & { lower: string; text: string }

// Packaged apps unpack resources/ next to app.asar
export const docsFolder = (): string => dirname(docsIndex.replace('app.asar', 'app.asar.unpacked'))

type Source = { id: string; title: string; site: string; pages: number }
type Docs = { fetchedAt: string; sources: Source[]; pages: Loaded[] }

let loading: Promise<Docs> | undefined

// All 4–5 MB of Markdown, read once on first use
function load(): Promise<Docs> {
  loading ??= (async () => {
    const index = JSON.parse(await readFile(join(docsFolder(), 'index.json'), 'utf8')) as {
      fetchedAt: string
      sources: Source[]
      pages: Page[]
    }
    const pages = await Promise.all(
      index.pages.map(async (page) => {
        const text = await readFile(join(docsFolder(), page.file), 'utf8')
        return { ...page, text, lower: text.toLowerCase() }
      })
    )
    return { fetchedAt: index.fetchedAt, sources: index.sources, pages }
  })()
  loading.catch(() => (loading = undefined))
  return loading
}

const STOP_WORDS = new Set(
  'a an and are as at be by can do does for from how i in is it near of on or the to use using what when with you your'.split(
    ' '
  )
)

function countOf(haystack: string, needle: string, cap: number): number {
  let count = 0
  for (
    let at = haystack.indexOf(needle);
    at >= 0 && count < cap;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    count++
  }
  return count
}

// ~300 characters of the page around the first place a term appears
function snippet(page: Loaded, terms: string[]): string {
  const at = terms
    .map((term) => page.lower.indexOf(term, 300))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0]
  const start = Math.max(0, (at ?? 300) - 120)
  return page.text
    .slice(start, start + 300)
    .replace(/\s+/g, ' ')
    .trim()
}

export async function searchDocs(
  query: string,
  options: { source?: string; section?: string; limit?: number } = {}
): Promise<object> {
  const { pages, fetchedAt, sources } = await load()
  const phrase = query.toLowerCase().trim()
  const terms = phrase.split(/[^a-z0-9_.-]+/).filter((t) => t.length > 1 && !STOP_WORDS.has(t))
  if (!terms.length) throw new Error('Search for some words, e.g. "deploy contract testnet".')
  const scored = pages
    .filter((p) => !options.source || p.source === options.source)
    .filter((p) => !options.section || p.section === options.section)
    .map((page) => {
      const title = page.title.toLowerCase()
      const about = page.description.toLowerCase()
      const file = page.file.toLowerCase()
      let score = 0
      let matched = 0
      for (const term of terms) {
        const inBody = countOf(page.lower, term, 12)
        const hit =
          (title.includes(term) ? 8 : 0) +
          (about.includes(term) ? 4 : 0) +
          (file.includes(term) ? 3 : 0) +
          inBody
        if (hit) matched++
        score += hit
      }
      if (terms.length > 1 && page.lower.includes(phrase)) score += 15
      // Pages that match every word first
      return { page, score: score * (matched / terms.length) ** 2, matched }
    })
    .filter((result) => result.matched > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(20, Math.max(1, options.limit ?? 8)))

  return {
    query,
    docsFetched: fetchedAt,
    results: scored.map(({ page }) => ({
      file: page.file,
      title: page.title,
      about: page.description,
      source: sources.find((s) => s.id === page.source)?.title ?? page.source,
      section: page.section,
      url: page.url,
      snippet: snippet(page, terms)
    })),
    next: 'Read a page with near_docs_read { "file": "<file>" }.'
  }
}

const PAGE_CHARS = 24_000

export async function readDoc(file: string, offset = 0): Promise<object> {
  const { pages } = await load()
  const wanted = normalize(file).replace(/^\/+/, '')
  if (wanted.startsWith('..') || wanted.includes(`${sep}..`)) throw new Error('Invalid file')
  const page = pages.find((p) => p.file === wanted)
  if (!page) {
    throw new Error(
      `No page ${file}. Find pages with near_docs_search; files look like near/smart-contracts/quickstart.md.`
    )
  }
  const start = Math.max(0, Math.floor(offset))
  const text = page.text.slice(start, start + PAGE_CHARS)
  const more = start + PAGE_CHARS < page.text.length
  return {
    file: page.file,
    title: page.title,
    url: page.url,
    totalChars: page.text.length,
    ...(more ? { nextOffset: start + PAGE_CHARS } : {}),
    text
  }
}

// Section names and page counts, for browsing
export async function docsOverview(): Promise<object> {
  const { pages, fetchedAt, sources } = await load()
  const sections: Record<string, number> = {}
  for (const page of pages) {
    const key = `${page.source}/${page.section}`
    sections[key] = (sections[key] ?? 0) + 1
  }
  return {
    docsFetched: fetchedAt,
    folder: docsFolder(),
    sources: sources.map(({ id, title, site, pages: count }) => ({
      id,
      title,
      site,
      pages: count
    })),
    pages: pages.length,
    sections
  }
}

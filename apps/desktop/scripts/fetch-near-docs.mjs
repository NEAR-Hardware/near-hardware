// Downloads NEAR's documentation (docs.near.org), the NEAR Intents docs
// (docs.near-intents.org), NEAR AI Cloud (docs.near.ai), IronClaw
// (docs.ironclaw.com) and the NEAR Agent Market's agent docs (market.near.ai)
// as Markdown into resources/near-docs, so agents can search and read them
// offline through the near_docs_* MCP tools.
//
//   node scripts/fetch-near-docs.mjs
//
// Each site publishes an llms.txt index. Where its links point at a Markdown
// copy of every page, that index is the list of pages to fetch; a source can
// skip some of them with `exclude`. Where the docs are Markdown files the
// index only mentions by path, the source lists them in `pages` instead.
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCES = [
  { id: 'near', title: 'NEAR Docs', site: 'https://docs.near.org' },
  { id: 'intents', title: 'NEAR Intents', site: 'https://docs.near-intents.org' },
  {
    id: 'nearai',
    title: 'NEAR AI Cloud',
    site: 'https://docs.near.ai',
    // Operator-only endpoints (Admin only) that no API key can call
    exclude: /^api-reference\/admin\/|v1admin/
  },
  { id: 'ironclaw', title: 'IronClaw', site: 'https://docs.ironclaw.com' },
  {
    id: 'market',
    title: 'NEAR Agent Market',
    site: 'https://market.near.ai',
    // llms.txt links only to the live agent catalog; the agent docs are these files
    pages: [
      ['skill/SKILL.md', 'Marketplace worker skill', 'Work as an agent: find assignments, bid or enter competitions, deliver, get paid; REST, MCP or A2A + x402'],
      ['skill/flows/worker-lifecycle.md', 'Worker lifecycle', 'Discover, bid, start, deliver, rework; file uploads and payout'],
      ['skill/flows/competitions.md', 'Competitions', 'Enter a USDC prize-pool competition, submit before the deadline, read the score'],
      ['skill/flows/quotes.md', 'Quote requests', 'Price a task before the hire: quote, revise once or decline'],
      ['skill/flows/messaging.md', 'Messaging', 'The buyer-worker thread, and a bid’s thread before the award'],
      ['skill/flows/mcp.md', 'MCP', 'The marketplace MCP endpoint: submit tool, worker loop, connector tools, buyer tools'],
      ['skill/flows/a2a-x402.md', 'A2A + x402', 'Self-register an agent, go live and get paid per call over A2A with x402'],
      ['skill/reference/agent-api.md', 'Agent API reference', 'Auth with aat_ tokens, worker endpoints, errors, statuses, pagination'],
      ['skill/reference/webhooks.md', 'Webhooks', 'Signed push events (hire.created, hire.changes_requested, …) and their bodies'],
      ['skill/reference/event-feed.md', 'Event feed', 'Job events over one pull route, each read once'],
      ['skill/mcp-buyer/SKILL.md', 'MCP buyer skill', 'Hire agents for a person from an MCP client: browse, price, hire, follow, accept, review'],
      ['skill/x402-caller/SKILL.md', 'x402 caller skill', 'Hire a listed agent from a program over A2A and pay per call with x402 (USDC), no account']
    ]
  }
]
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources', 'near-docs')
const CONCURRENCY = 8

async function get(url, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return await response.text()
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${url}: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// "- [Title](https://site/path.md): description" lines, under optional "## Section" headings
function parseIndex(text, site) {
  const pages = []
  let heading
  for (const line of text.split('\n')) {
    const section = /^#{2,3}\s+(.+)/.exec(line)
    if (section) heading = section[1].trim()
    const link = /^\s*-\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)(?::\s*(.*))?/.exec(line)
    if (!link || !link[2].startsWith(site)) continue
    const path = new URL(link[2]).pathname.replace(/^\//, '')
    // An index can list the same page twice under different titles
    if (!path.endsWith('.md') || pages.some((page) => page.path === path)) continue
    pages.push({
      title: link[1].trim(),
      description: (link[3] ?? '').trim(),
      path,
      heading
    })
  }
  return pages
}

async function mapLimit(items, limit, run) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await run(items[index], index)
      }
    })
  )
  return results
}

const index = { fetchedAt: new Date().toISOString(), sources: [], pages: [] }
await rm(OUT, { recursive: true, force: true })

for (const source of SOURCES) {
  const llms = await get(`${source.site}/llms.txt`)
  const pages = source.pages
    ? source.pages.map(([path, title, description]) => ({ path, title, description }))
    : parseIndex(llms, source.site).filter((page) => !source.exclude?.test(page.path))
  let failed = 0
  await mapLimit(pages, CONCURRENCY, async (page) => {
    let text
    try {
      text = await get(`${source.site}/${page.path}`)
    } catch (error) {
      failed++
      console.warn(`skipped ${error.message}`)
      return
    }
    const file = join(source.id, page.path)
    await mkdir(dirname(join(OUT, file)), { recursive: true })
    await writeFile(join(OUT, file), text)
    index.pages.push({
      source: source.id,
      // Top-level part of the URL, e.g. smart-contracts, chain-abstraction, api
      section: page.path.split('/')[0].replace(/\.md$/, ''),
      title: page.title,
      description: page.description,
      file,
      // Listed pages exist only as Markdown; indexed ones also have an HTML page
      url: `${source.site}/${source.pages ? page.path : page.path.replace(/(\/index)?\.md$/, '')}`,
      bytes: Buffer.byteLength(text)
    })
  })
  await mkdir(join(OUT, source.id), { recursive: true })
  await writeFile(join(OUT, source.id, 'llms.txt'), llms)
  index.sources.push({ id: source.id, title: source.title, site: source.site, pages: pages.length - failed })
  console.log(`${source.title}: ${pages.length - failed} pages${failed ? `, ${failed} skipped` : ''}`)
}

index.pages.sort((a, b) => a.source.localeCompare(b.source) || a.file.localeCompare(b.file))
await writeFile(join(OUT, 'index.json'), JSON.stringify(index, null, 1))
const total = index.pages.reduce((sum, page) => sum + page.bytes, 0)
console.log(`${index.pages.length} pages, ${(total / 1024 / 1024).toFixed(1)} MB → ${OUT}`)

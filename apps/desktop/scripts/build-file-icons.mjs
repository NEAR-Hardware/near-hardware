// Builds the file tree's icon set from the MIT-licensed file-icons pack
// (https://github.com/file-icons/vscode), the same pack as Cursor/VS Code's
// "File Icons" theme. Downloads the fonts and theme at a pinned commit and
// compacts the 700 KB theme JSON into a lookup table the renderer can import.
//
//   node scripts/build-file-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const COMMIT = '2cbaf95b609c2f08a50a32c18970c9b887086480'
const BASE = `https://raw.githubusercontent.com/file-icons/vscode/${COMMIT}`
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/renderer/src/assets/file-icons')

const fetchOk = async (path) => {
  const response = await fetch(`${BASE}/${path}`)
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return response
}

await mkdir(OUT, { recursive: true })

const theme = await (await fetchOk('icons/file-icons-icon-theme.json')).json()
for (const font of theme.fonts) {
  const file = font.src[0].path.replace('./', '')
  await writeFile(join(OUT, file), Buffer.from(await (await fetchOk(`icons/${file}`)).arrayBuffer()))
}
await writeFile(join(OUT, 'LICENSE.md'), await (await fetchOk('LICENSE.md')).text())

// Keep only the definitions the lookups below actually reference, as
// [character, font index, color, size] tuples
const fonts = theme.fonts.map((font) => font.id)
const icons = []
const indexOf = new Map()
const ref = (key) => {
  if (!indexOf.has(key)) {
    const { fontCharacter, fontId, fontColor, fontSize } = theme.iconDefinitions[key]
    // Mostly CSS-style escapes like "\e91c", but a few glyphs sit on plain letters
    const character = fontCharacter.startsWith('\\')
      ? String.fromCodePoint(parseInt(fontCharacter.slice(1), 16))
      : fontCharacter
    indexOf.set(key, icons.length)
    icons.push([character, fonts.indexOf(fontId), fontColor ?? null, fontSize ?? null])
  }
  return indexOf.get(key)
}
const mapAll = (table = {}) =>
  Object.fromEntries(Object.entries(table).map(([name, key]) => [name.toLowerCase(), ref(key)]))

const compact = {
  source: `file-icons/vscode@${COMMIT}`,
  fonts,
  file: ref(theme.file),
  folder: ref(theme.folder),
  fileNames: mapAll(theme.fileNames),
  fileExtensions: mapAll(theme.fileExtensions),
  folderNames: mapAll(theme.folderNames),
  icons
}
await writeFile(join(OUT, 'icons.json'), JSON.stringify(compact))
console.log(
  `Wrote ${icons.length} icons, ${Object.keys(compact.fileNames).length} file names, ` +
    `${Object.keys(compact.fileExtensions).length} extensions to ${OUT}`
)

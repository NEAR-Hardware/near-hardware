import { Folder, FolderOpen } from 'lucide-react'
import iconData from '../assets/file-icons/icons.json'
import '../assets/file-icons/file-icons.css'

// [character, font index, color, size] — see scripts/build-file-icons.mjs
type IconTuple = [string, number, string | null, string | null]

type IconData = {
  fonts: string[]
  file: number
  folder: number
  fileNames: Record<string, number>
  fileExtensions: Record<string, number>
  folderNames: Record<string, number>
  icons: IconTuple[]
}

const data = iconData as unknown as IconData

// Same order VS Code uses: exact file name, then the longest matching
// extension ("cargo.toml" before "toml"), then the default. Plain folders
// return null and get an outline folder instead, like Cursor's files panel.
function resolveIcon(name: string, kind: 'file' | 'directory'): IconTuple | null {
  const lower = name.toLowerCase()
  if (kind === 'directory') {
    return lower in data.folderNames ? data.icons[data.folderNames[lower]] : null
  }
  if (lower in data.fileNames) return data.icons[data.fileNames[lower]]
  const segments = lower.split('.')
  for (let i = 0; i < segments.length; i++) {
    const extension = segments.slice(i).join('.')
    if (extension && extension in data.fileExtensions) {
      return data.icons[data.fileExtensions[extension]]
    }
  }
  return data.icons[data.file]
}

type FileIconProps = {
  name: string
  kind: 'file' | 'directory'
  expanded?: boolean
}

function FileIcon({ name, kind, expanded = false }: FileIconProps): React.JSX.Element {
  const icon = resolveIcon(name, kind)
  if (!icon) {
    const FolderGlyph = expanded ? FolderOpen : Folder
    return (
      <span className="file-icon" aria-hidden="true">
        <FolderGlyph size={15} strokeWidth={1.5} />
      </span>
    )
  }
  const [character, font, color, size] = icon
  return (
    <span
      className="file-icon"
      aria-hidden="true"
      style={{
        fontFamily: `nh-${data.fonts[font]}`,
        color: color ?? undefined,
        fontSize: size ? `calc(14px * ${parseFloat(size) / 100})` : undefined
      }}
    >
      {character}
    </span>
  )
}

export default FileIcon

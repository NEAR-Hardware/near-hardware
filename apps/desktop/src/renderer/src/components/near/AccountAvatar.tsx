import { memo, useMemo } from 'react'
import { AVATAR_SIZE, avatarSeed, generateAvatar } from '../../../../shared/avatar'

type AccountAvatarProps = {
  accountId: string
  // Bumped by Shuffle Avatar
  variant?: number
  size?: number
}

// An account's pixel character, drawn as one rect per run of same-colored pixels
function AccountAvatar({ accountId, variant, size = 32 }: AccountAvatarProps): React.JSX.Element {
  const runs = useMemo(() => {
    const { palette, pixels } = generateAvatar(avatarSeed(accountId, variant))
    const result: { x: number; y: number; w: number; color: string }[] = []
    pixels.forEach((row, y) => {
      let start = 0
      for (let x = 1; x <= row.length; x++) {
        if (x === row.length || row[x] !== row[start]) {
          // The background is the SVG's fill
          if (row[start] !== 0)
            result.push({ x: start, y, w: x - start, color: palette[row[start]] })
          start = x
        }
      }
    })
    return { background: palette[0], result }
  }, [accountId, variant])

  return (
    <svg
      className="account-avatar"
      viewBox={`0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ background: runs.background }}
    >
      {runs.result.map(({ x, y, w, color }) => (
        <rect key={`${x},${y}`} x={x} y={y} width={w} height={1} fill={color} />
      ))}
    </svg>
  )
}

export default memo(AccountAvatar)

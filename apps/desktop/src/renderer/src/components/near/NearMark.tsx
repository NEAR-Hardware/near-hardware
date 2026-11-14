import { siNear } from 'simple-icons'
import type { NearNetwork } from '../../../../shared/near'

type NearMarkProps = {
  size?: number
  // In a rounded tile, like agent icons; testnet's tile is dimmer
  tile?: NearNetwork
}

// NEAR's logo mark
function NearMark({ size = 16, tile }: NearMarkProps): React.JSX.Element {
  const svg = (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d={siNear.path} />
    </svg>
  )
  if (!tile) return <span className="near-mark">{svg}</span>
  return (
    <span
      className={`near-tile ${tile}`}
      style={{ width: Math.round(size * 2), height: Math.round(size * 2) }}
    >
      {svg}
    </span>
  )
}

export default NearMark

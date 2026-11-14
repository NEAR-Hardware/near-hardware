import { siRaspberrypi } from 'simple-icons'

type RaspberryPiIconProps = {
  size?: number
  // The raspberry red; otherwise the surrounding text color (e.g. a status chip's green or red)
  brand?: boolean
}

// The Raspberry Pi logo
function RaspberryPiIcon({ size = 14, brand }: RaspberryPiIconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill={brand ? `#${siRaspberrypi.hex}` : 'currentColor'}
      style={{ flexShrink: 0 }}
    >
      <path d={siRaspberrypi.path} />
    </svg>
  )
}

export default RaspberryPiIcon

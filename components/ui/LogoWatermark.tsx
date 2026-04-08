import Image from 'next/image'

/**
 * LogoWatermark
 * Renders the Kitea logo as a fixed, full-viewport watermark behind all page
 * content.  Sits at z-index 0; the layout shell that wraps <Header>, page
 * children, and <Footer> is at z-index 1, so content is always above this.
 */
export default function LogoWatermark() {
  return (
    <Image
      src="/images/Kitea Logo Only.png"
      alt=""
      aria-hidden="true"
      width={1200}
      height={1200}
      priority={false}
      style={{
        position:      'fixed',
        top:           '50%',
        left:          '50%',
        transform:     'translate(-50%, -50%)',
        width:         '65vw',
        height:        'auto',
        zIndex:        1,
        opacity:       0.12,
        pointerEvents: 'none',
        userSelect:    'none',
      }}
    />
  )
}

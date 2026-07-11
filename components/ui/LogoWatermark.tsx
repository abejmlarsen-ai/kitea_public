import Image from 'next/image'

export default function LogoWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        bottom:         0,
        zIndex:         1,
        pointerEvents:  'none',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src="/images/Kitea Logo Only.png"
        alt=""
        width={1200}
        height={1200}
        priority={false}
        style={{
          width:      '65vw',
          height:     'auto',
          opacity:    0.10,
          userSelect: 'none',
        }}
      />
    </div>
  )
}

export type MascotKind = 'lion' | 'cat' | 'dog'

// Podium slot → mascot. Slot 0 is the winner's (centre) spot.
export const SLOT_MASCOTS: MascotKind[] = ['lion', 'cat', 'dog']

const INK = '#1c1917' // stone-900, matches the app's borders

// Spiky mane for the lion: alternating outer/inner points around the head.
const MANE_PATH = (() => {
  const cx = 60, cy = 50, spikes = 18, outer = 42, inner = 32
  const pts: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / spikes - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
})()

const LABELS: Record<MascotKind, string> = {
  lion: 'Lion mascot',
  cat: 'Cat mascot',
  dog: 'Dog mascot',
}

export default function Mascot({ kind, className = '' }: { kind: MascotKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 124"
      role="img"
      aria-label={LABELS[kind]}
      className={`mascot mascot-${kind} overflow-visible ${className}`}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {kind === 'lion' && <Lion />}
      {kind === 'cat' && <Cat />}
      {kind === 'dog' && <Dog />}
    </svg>
  )
}

function Lion() {
  return (
    <>
      <g className="mascot-tail" style={{ transformOrigin: '80px 104px' }}>
        <path d="M80 104 Q104 104 102 82" fill="none" strokeWidth={4} />
        <path d="M102 82 l-6 -8 l8 -2 l6 6 Z" fill="#f97316" />
      </g>
      <ellipse cx="60" cy="102" rx="26" ry="18" fill="#fbbf24" />
      <g className="mascot-mane" style={{ transformOrigin: '60px 50px' }}>
        <path d={MANE_PATH} fill="#f97316" />
      </g>
      <circle cx="40" cy="28" r="7" fill="#fbbf24" />
      <circle cx="80" cy="28" r="7" fill="#fbbf24" />
      <circle cx="60" cy="52" r="26" fill="#fbbf24" />
      <circle cx="45" cy="60" r="4" fill="#fb923c" stroke="none" />
      <circle cx="75" cy="60" r="4" fill="#fb923c" stroke="none" />
      <g className="mascot-eyes" style={{ transformOrigin: '60px 48px' }}>
        <ellipse cx="51" cy="48" rx="3" ry="4" fill={INK} stroke="none" />
        <ellipse cx="69" cy="48" rx="3" ry="4" fill={INK} stroke="none" />
      </g>
      <path d="M55 56 L65 56 L60 61 Z" fill={INK} strokeWidth={2} />
      <path d="M60 61 Q56 67 51 64 M60 61 Q64 67 69 64" fill="none" strokeWidth={2.5} />
      <ellipse cx="47" cy="117" rx="9" ry="5" fill="#fbbf24" />
      <ellipse cx="73" cy="117" rx="9" ry="5" fill="#fbbf24" />
      <g className="mascot-crown" style={{ transformOrigin: '60px 14px' }}>
        <path d="M44 16 L46 0 L53 8 L60 -4 L67 8 L74 0 L76 16 Z" fill="#fde047" />
        <circle cx="60" cy="9" r="2.5" fill="#f97316" strokeWidth={1.5} />
      </g>
    </>
  )
}

function Cat() {
  return (
    <>
      <g className="mascot-tail" style={{ transformOrigin: '82px 108px' }}>
        <path d="M82 108 Q108 106 104 84 Q102 72 110 66" fill="none" strokeWidth={11} />
        <path d="M82 108 Q108 106 104 84 Q102 72 110 66" fill="none" stroke="#d6d3d1" strokeWidth={5} />
      </g>
      <ellipse cx="60" cy="102" rx="24" ry="18" fill="#d6d3d1" />
      <path d="M52 92 q8 4 16 0" fill="none" stroke="#a8a29e" strokeWidth={3} />
      <path d="M36 40 L38 12 L58 28 Z" fill="#d6d3d1" />
      <path d="M41 34 L42 20 L51 28 Z" fill="#fde68a" stroke="none" />
      <g className="mascot-ear" style={{ transformOrigin: '72px 32px' }}>
        <path d="M84 40 L82 12 L62 28 Z" fill="#d6d3d1" />
        <path d="M79 34 L78 20 L69 28 Z" fill="#fde68a" stroke="none" />
      </g>
      <ellipse cx="60" cy="52" rx="29" ry="25" fill="#d6d3d1" />
      <path d="M54 30 v6 M60 28 v8 M66 30 v6" fill="none" stroke="#a8a29e" strokeWidth={3} />
      <g className="mascot-eyes" style={{ transformOrigin: '60px 50px' }}>
        <ellipse cx="49" cy="50" rx="4.5" ry="5.5" fill={INK} stroke="none" />
        <ellipse cx="71" cy="50" rx="4.5" ry="5.5" fill={INK} stroke="none" />
        <circle cx="50.5" cy="48" r="1.5" fill="#fff" stroke="none" />
        <circle cx="72.5" cy="48" r="1.5" fill="#fff" stroke="none" />
      </g>
      <path d="M57 58 L63 58 L60 61 Z" fill="#fb923c" strokeWidth={2} />
      <path d="M60 61 Q57 66 53 63 M60 61 Q63 66 67 63" fill="none" strokeWidth={2.5} />
      <g className="mascot-whiskers" style={{ transformOrigin: '60px 60px' }} strokeWidth={2}>
        <path d="M44 58 L28 55 M44 62 L28 64 M76 58 L92 55 M76 62 L92 64" fill="none" />
      </g>
      <ellipse cx="48" cy="117" rx="8" ry="5" fill="#d6d3d1" />
      <ellipse cx="72" cy="117" rx="8" ry="5" fill="#d6d3d1" />
    </>
  )
}

function Dog() {
  return (
    <>
      <g className="mascot-tail" style={{ transformOrigin: '82px 102px' }}>
        <path d="M82 102 Q98 96 100 80" fill="none" strokeWidth={10} />
        <path d="M82 102 Q98 96 100 80" fill="none" stroke="#fdba74" strokeWidth={4} />
      </g>
      <ellipse cx="60" cy="102" rx="25" ry="18" fill="#fdba74" />
      <ellipse cx="60" cy="104" rx="12" ry="10" fill="#fef3c7" strokeWidth={2} />
      <circle cx="60" cy="50" r="27" fill="#fdba74" />
      <ellipse cx="70" cy="46" rx="10" ry="9" fill="#fb923c" stroke="none" />
      <g className="mascot-ear-l" style={{ transformOrigin: '40px 30px' }}>
        <path d="M40 28 Q24 30 26 56 Q30 64 38 56 Q42 40 40 28 Z" fill="#44403c" />
      </g>
      <g className="mascot-ear-r" style={{ transformOrigin: '80px 30px' }}>
        <path d="M80 28 Q96 30 94 56 Q90 64 82 56 Q78 40 80 28 Z" fill="#44403c" />
      </g>
      <g className="mascot-eyes" style={{ transformOrigin: '60px 46px' }}>
        <ellipse cx="50" cy="46" rx="3.5" ry="4.5" fill={INK} stroke="none" />
        <ellipse cx="70" cy="46" rx="3.5" ry="4.5" fill={INK} stroke="none" />
      </g>
      <ellipse cx="60" cy="61" rx="13" ry="9" fill="#fef3c7" />
      <g className="mascot-tongue" style={{ transformOrigin: '60px 64px' }}>
        <path d="M55 64 Q55 76 60 76 Q65 76 65 64 Z" fill="#f87171" strokeWidth={2} />
      </g>
      <ellipse cx="60" cy="56" rx="5" ry="3.5" fill={INK} stroke="none" />
      <path d="M60 59 v3 M52 63 Q60 68 68 63" fill="none" strokeWidth={2.5} />
      <ellipse cx="47" cy="117" rx="9" ry="5" fill="#fdba74" />
      <ellipse cx="73" cy="117" rx="9" ry="5" fill="#fdba74" />
    </>
  )
}

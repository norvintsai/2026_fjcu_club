interface Props {
  category: string
  size?: number
}

const G = '#00ff88'
const B = '#00d4ff'
const Y = '#ffd700'
const P = '#ff00ff'
const R = '#ff6688'

// ── 學術性社團：原子（三軌道橢圓 + 電子 + 核心）
function Atom({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* glow */}
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="5" opacity="0.10" />
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="5" opacity="0.10" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="5" opacity="0.10" transform="rotate(-60 50 50)" />
      {/* orbits */}
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="1.2" />
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="1.2" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke={G} strokeWidth="1.2" transform="rotate(-60 50 50)" />
      {/* nucleus glow */}
      <circle cx="50" cy="50" r="11" fill={G} opacity="0.15" />
      {/* nucleus */}
      <circle cx="50" cy="50" r="6" fill={G} />
      {/* electrons: right of flat orbit, top-left and bottom-left of rotated */}
      <circle cx="88" cy="50" r="3.5" fill={B} />
      <circle cx="31" cy="19" r="3.5" fill={B} />
      <circle cx="31" cy="81" r="3.5" fill={B} />
    </svg>
  )
}

// ── 休閒聯誼性社團：六邊形星座網絡
function Network({ s }: { s: number }) {
  const pts: [number, number][] = [
    [50, 10], [83, 30], [83, 70], [50, 90], [17, 70], [17, 30],
  ]
  const polyStr = pts.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer hex */}
      <polygon points={polyStr} stroke={G} strokeWidth="0.8" opacity="0.3" />
      {/* lines to center */}
      {pts.map(([x, y], i) => (
        <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={G} strokeWidth="0.9" opacity="0.45" />
      ))}
      {/* diagonal cross-links */}
      <line x1="83" y1="30" x2="17" y2="70" stroke={B} strokeWidth="0.6" opacity="0.2" />
      <line x1="17" y1="30" x2="83" y2="70" stroke={B} strokeWidth="0.6" opacity="0.2" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={B} strokeWidth="0.6" opacity="0.2" />
      {/* outer nodes */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={B} opacity="0.85" />
      ))}
      {/* center glow */}
      <circle cx="50" cy="50" r="10" fill={G} opacity="0.15" />
      {/* center node */}
      <circle cx="50" cy="50" r="6" fill={G} />
    </svg>
  )
}

// ── 服務性社團：心跳脈搏線（EKG）
function Heartbeat({ s }: { s: number }) {
  const pts = '4,50 18,50 24,28 32,72 40,36 48,64 56,50 68,50 74,30 80,70 88,50 96,50'
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* glow layer */}
      <polyline points={pts} stroke={G} strokeWidth="5" opacity="0.1"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* main line */}
      <polyline points={pts} stroke={G} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* accent peak dot */}
      <circle cx="80" cy="30" r="3.5" fill={R} />
      <circle cx="80" cy="30" r="7" fill={R} opacity="0.15" />
      {/* side glow dots */}
      <circle cx="4" cy="50" r="2.5" fill={G} opacity="0.6" />
      <circle cx="96" cy="50" r="2.5" fill={G} opacity="0.6" />
      {/* baseline */}
      <line x1="4" y1="50" x2="96" y2="50" stroke={G} strokeWidth="0.5" opacity="0.2" />
    </svg>
  )
}

// ── 藝術性社團：多層幾何菱形（水晶稜鏡）
function Crystal({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer diamond glow */}
      <polygon points="50,5 95,50 50,95 5,50" stroke={G} strokeWidth="5" opacity="0.10" />
      {/* outer diamond */}
      <polygon points="50,5 95,50 50,95 5,50" stroke={G} strokeWidth="1.2" />
      {/* mid diamond */}
      <polygon points="50,20 80,50 50,80 20,50" stroke={B} strokeWidth="1" opacity="0.65" />
      {/* inner diamond */}
      <polygon points="50,35 65,50 50,65 35,50" stroke={Y} strokeWidth="0.8" opacity="0.5" />
      {/* facet lines */}
      <line x1="50" y1="5" x2="20" y2="50" stroke={Y} strokeWidth="0.7" opacity="0.35" />
      <line x1="50" y1="5" x2="80" y2="50" stroke={Y} strokeWidth="0.7" opacity="0.35" />
      <line x1="50" y1="95" x2="20" y2="50" stroke={B} strokeWidth="0.7" opacity="0.25" />
      <line x1="50" y1="95" x2="80" y2="50" stroke={B} strokeWidth="0.7" opacity="0.25" />
      {/* axis */}
      <line x1="5" y1="50" x2="95" y2="50" stroke={G} strokeWidth="0.5" opacity="0.2" />
      <line x1="50" y1="5" x2="50" y2="95" stroke={G} strokeWidth="0.5" opacity="0.2" />
      {/* apex gems */}
      <circle cx="50" cy="5" r="3" fill={Y} opacity="0.9" />
      <circle cx="95" cy="50" r="2.5" fill={B} opacity="0.8" />
      <circle cx="5" cy="50" r="2.5" fill={B} opacity="0.8" />
      {/* center gem glow */}
      <circle cx="50" cy="50" r="8" fill={G} opacity="0.12" />
      <circle cx="50" cy="50" r="4" fill={G} />
    </svg>
  )
}

// ── 音樂性社團：等化器長條（7 bar equalizer）
function Equalizer({ s }: { s: number }) {
  const bars: [number, number][] = [
    [9, 30], [21, 42], [33, 18], [45, 26], [57, 12], [69, 38], [81, 52],
  ]
  const baseline = 84
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* glow bars */}
      {bars.map(([x, topY], i) => (
        <rect key={i} x={x} y={topY} width="9" height={baseline - topY} rx="1.5"
          fill={G} opacity={0.08 + i * 0.02} />
      ))}
      {/* main bars */}
      {bars.map(([x, topY], i) => (
        <rect key={i} x={x} y={topY} width="9" height={baseline - topY} rx="1.5"
          fill="none" stroke={G}
          strokeWidth="1.2"
          opacity={0.65 + i * 0.05}
        />
      ))}
      {/* peak dots */}
      {bars.map(([x, topY], i) => (
        <rect key={i} x={x} y={topY - 3} width="9" height="2.5" rx="1"
          fill={i === 4 ? B : G} opacity="0.9" />
      ))}
      {/* fill highlight on tallest bar */}
      <rect x="57" y="12" width="9" height={baseline - 12} rx="1.5"
        fill={G} opacity="0.12" />
      {/* baseline */}
      <line x1="6" y1={baseline} x2="94" y2={baseline} stroke={B} strokeWidth="1" opacity="0.45" />
    </svg>
  )
}

// ── 體能性社團：六邊形 + 閃電
function Lightning({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* hex glow */}
      <polygon points="50,5 88,27 88,73 50,95 12,73 12,27" stroke={G} strokeWidth="5" opacity="0.10" />
      {/* hex */}
      <polygon points="50,5 88,27 88,73 50,95 12,73 12,27" stroke={G} strokeWidth="1.5" />
      {/* bolt glow */}
      <path d="M60 16 L35 52 L52 52 L40 84 L68 44 L51 44 Z"
        fill={Y} opacity="0.15" />
      {/* bolt */}
      <path d="M60 16 L35 52 L52 52 L40 84 L68 44 L51 44 Z"
        fill={Y} opacity="0.88" strokeLinejoin="round" />
      {/* bolt inner highlight */}
      <path d="M57 22 L40 50 L52 50" stroke="white" strokeWidth="1" opacity="0.3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── 其他單位：齒輪（交替半徑多邊形）
function Gear({ s }: { s: number }) {
  const teeth = 10
  const outerR = 42, innerR = 33, centerR = 15
  const pts: string[] = []
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  const gearD = `M ${pts.join(' L ')} Z`

  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* gear glow */}
      <path d={gearD} stroke={G} strokeWidth="4" opacity="0.10" />
      {/* gear */}
      <path d={gearD} stroke={G} strokeWidth="1.3" />
      {/* inner ring glow */}
      <circle cx="50" cy="50" r={centerR} stroke={B} strokeWidth="4" opacity="0.1" />
      {/* inner ring */}
      <circle cx="50" cy="50" r={centerR} stroke={B} strokeWidth="1.2" />
      {/* crosshair */}
      <line x1="50" y1={50 - centerR + 4} x2="50" y2={50 + centerR - 4}
        stroke={B} strokeWidth="0.8" opacity="0.55" />
      <line x1={50 - centerR + 4} y1="50" x2={50 + centerR - 4} y2="50"
        stroke={B} strokeWidth="0.8" opacity="0.55" />
      {/* center dot glow */}
      <circle cx="50" cy="50" r="7" fill={G} opacity="0.15" />
      {/* center dot */}
      <circle cx="50" cy="50" r="4" fill={G} />
    </svg>
  )
}

const ICON_MAP: Record<string, (s: number) => React.ReactElement> = {
  '學術性社團':    s => <Atom s={s} />,
  '休閒聯誼性社團': s => <Network s={s} />,
  '服務性社團':    s => <Heartbeat s={s} />,
  '藝術性社團':    s => <Crystal s={s} />,
  '音樂性社團':    s => <Equalizer s={s} />,
  '體能性社團':    s => <Lightning s={s} />,
  '其他單位':      s => <Gear s={s} />,
}

export default function ClubIcon({ category, size = 80 }: Props) {
  const render = ICON_MAP[category]
  if (!render) return null
  return render(size)
}

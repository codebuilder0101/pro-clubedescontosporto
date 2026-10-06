/**
 * Static Ribeira illustration (sky, Dom Luís I bridge, houses, Douro).
 * Decorative: the parent provides the accessible label.
 */
const houses = [
  { x: 40, w: 70, h: 78, fill: "#FFC531" },
  { x: 118, w: 56, h: 96, fill: "#F2A2B5" },
  { x: 180, w: 64, h: 70, fill: "#FBFAF6" },
  { x: 250, w: 58, h: 104, fill: "#F08A5D" },
  { x: 316, w: 72, h: 80, fill: "#DCE5F6" },
  { x: 396, w: 60, h: 92, fill: "#FFD866" },
  { x: 462, w: 70, h: 74, fill: "#F2A2B5" },
  { x: 540, w: 60, h: 88, fill: "#FBFAF6" },
];

export function RibeiraScene() {
  const horizon = 560;
  return (
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="rb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5E97E0" />
          <stop offset=".55" stopColor="#A9C9EF" />
          <stop offset="1" stopColor="#FCE3B0" />
        </linearGradient>
        <linearGradient id="rb-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E62C4" />
          <stop offset="1" stopColor="#0F2D6B" />
        </linearGradient>
      </defs>

      <rect width="600" height="800" fill="url(#rb-sky)" />
      <circle cx="430" cy="420" r="58" fill="#FFE9A8" opacity=".9" />

      {/* Clouds */}
      <g fill="#fff" opacity=".85">
        <ellipse cx="150" cy="250" rx="70" ry="16" />
        <ellipse cx="185" cy="238" rx="38" ry="18" />
        <ellipse cx="470" cy="300" rx="60" ry="13" />
      </g>

      {/* Birds */}
      <g fill="none" stroke="#14213D" strokeWidth="2.4" strokeLinecap="round">
        <path d="M200 170q8-7 16 0q8-7 16 0" />
        <path d="M140 320q6-5 12 0q6-5 12 0" />
        <path d="M480 190q6-5 12 0q6-5 12 0" />
      </g>

      {/* Far skyline */}
      <g fill="#B9CCEB">
        <rect x="0" y="470" width="600" height="90" />
        <rect x="60" y="440" width="30" height="40" />
        <rect x="300" y="430" width="24" height="50" />
        <rect x="500" y="445" width="36" height="35" />
      </g>

      {/* Dom Luís I bridge */}
      <g fill="none" stroke="#1747A6" strokeWidth="9">
        <path d="M-20 360H640" />
        <path d="M120 560C200 360 420 360 520 560" strokeWidth="11" />
        <path d="M150 560C220 400 400 400 490 560" strokeWidth="5" />
      </g>
      <g stroke="#1747A6" strokeWidth="3">
        {Array.from({ length: 22 }, (_, i) => {
          const x = 130 + i * 18;
          return <line key={i} x1={x} y1={360} x2={x} y2={horizon} opacity=".8" />;
        })}
      </g>
      <rect x="250" y="342" width="60" height="12" rx="3" fill="#FFC531" />

      {/* Houses */}
      {houses.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y={horizon - h.h} width={h.w} height={h.h} fill={h.fill} />
          <path
            d={`M${h.x - 6} ${horizon - h.h}L${h.x + h.w / 2} ${horizon - h.h - 28}L${h.x + h.w + 6} ${horizon - h.h}Z`}
            fill="#D9653B"
          />
          <rect x={h.x + 12} y={horizon - h.h + 20} width="14" height="20" fill="#0F2D6B" opacity=".85" />
          <rect x={h.x + h.w - 26} y={horizon - h.h + 20} width="14" height="20" fill="#0F2D6B" opacity=".85" />
        </g>
      ))}

      {/* Douro */}
      <rect x="0" y={horizon} width="600" height={800 - horizon} fill="url(#rb-river)" />
      <g stroke="#DCE5F6" strokeWidth="3" strokeLinecap="round" opacity=".45">
        <path d="M60 610h60M220 640h90M420 600h70M100 700h80M360 720h110M500 670h50" />
      </g>

      {/* Rabelo boat */}
      <g transform="translate(400 640)">
        <path d="M0 0h110l-14 18H14z" fill="#5A3A22" />
        <rect x="50" y="-60" width="4" height="60" fill="#5A3A22" />
        <rect x="26" y="-56" width="52" height="40" fill="#FBFAF6" />
      </g>
    </svg>
  );
}

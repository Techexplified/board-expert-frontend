export function BottomWaves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden rounded-b-2xl">
      <svg
        viewBox="0 0 640 80"
        preserveAspectRatio="none"
        className="h-16 w-full"
        aria-hidden="true"
      >
        <path
          d="M0,44 C110,10 210,72 340,56 C460,40 545,8 640,28 L640,80 L0,80 Z"
          fill="#e7f1e8"
          fillOpacity="0.85"
        />
        <path
          d="M0,58 C135,28 245,78 395,62 C510,50 575,26 640,42 L640,80 L0,80 Z"
          fill="#dbeadb"
          fillOpacity="0.7"
        />
      </svg>
    </div>
  )
}

export function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 180 140" className="h-32 w-40" aria-hidden="true">
      <circle cx="88" cy="70" r="56" fill="#e6f2e7" />
      {/* Accent rays */}
      <g stroke="#e08926" strokeWidth="3" strokeLinecap="round">
        <line x1="138" y1="22" x2="143" y2="12" />
        <line x1="149" y1="30" x2="158" y2="23" />
        <line x1="154" y1="42" x2="164" y2="40" />
      </g>
      {/* Spreadsheet card */}
      <rect
        x="42"
        y="32"
        width="82"
        height="72"
        rx="10"
        fill="#ffffff"
        stroke="#1b5933"
        strokeWidth="2.5"
      />
      <path
        d="M42 42a10 10 0 0 1 10-10h62a10 10 0 0 1 10 10v10H42V42z"
        fill="#1f6336"
      />
      <text
        x="83"
        y="46"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        CSV / Excel
      </text>
      {/* Grid cells */}
      <g fill="#dff0e1">
        <rect x="52" y="60" width="18" height="7" rx="2" />
        <rect x="74" y="60" width="18" height="7" rx="2" />
        <rect x="96" y="60" width="18" height="7" rx="2" />
        <rect x="52" y="72" width="18" height="7" rx="2" />
        <rect x="74" y="72" width="18" height="7" rx="2" />
        <rect x="96" y="72" width="18" height="7" rx="2" />
        <rect x="52" y="84" width="18" height="7" rx="2" />
        <rect x="74" y="84" width="18" height="7" rx="2" />
        <rect x="96" y="84" width="18" height="7" rx="2" />
      </g>
      {/* Orange download badge */}
      <circle cx="119" cy="96" r="20" fill="#e58c28" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M119 88v12m0 0l-5-5m5 5l5-5m-8 9h6"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function ExportingIllustration() {
  return (
    <svg viewBox="0 0 180 140" className="h-28 w-36" aria-hidden="true">
      <circle cx="88" cy="70" r="54" fill="#e7f3e8" />
      {/* Back sheet */}
      <g transform="rotate(-7 88 64)">
        <rect
          x="50"
          y="28"
          width="78"
          height="64"
          rx="8"
          fill="#ffffff"
          stroke="#1b5933"
          strokeWidth="2.2"
        />
      </g>
      {/* Front tilted spreadsheet */}
      <g transform="rotate(-3 90 70)">
        <rect
          x="44"
          y="38"
          width="86"
          height="66"
          rx="9"
          fill="#ffffff"
          stroke="#1b5933"
          strokeWidth="2.5"
        />
        <g fill="#53a645">
          <rect x="52" y="48" width="16" height="8" rx="1.5" />
          <rect x="71" y="48" width="16" height="8" rx="1.5" />
          <rect x="90" y="48" width="16" height="8" rx="1.5" />
          <rect x="109" y="48" width="13" height="8" rx="1.5" />
        </g>
        <g fill="#dcf0dc">
          <rect x="52" y="60" width="16" height="7" rx="1.5" />
          <rect x="71" y="60" width="16" height="7" rx="1.5" />
          <rect x="90" y="60" width="16" height="7" rx="1.5" />
          <rect x="109" y="60" width="13" height="7" rx="1.5" />
          <rect x="52" y="71" width="16" height="7" rx="1.5" />
          <rect x="71" y="71" width="16" height="7" rx="1.5" />
          <rect x="90" y="71" width="16" height="7" rx="1.5" />
          <rect x="52" y="82" width="16" height="7" rx="1.5" />
          <rect x="71" y="82" width="16" height="7" rx="1.5" />
        </g>
      </g>
      {/* Green download badge */}
      <circle cx="119" cy="96" r="19" fill="#4f9e36" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M119 88v12m0 0l-5-5m5 5l5-5m-8 9h6"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function CompletedIllustration({ format = 'csv' }) {
  const badgeText = format === 'xlsx' ? 'XLSX' : 'CSV'
  return (
    <svg viewBox="0 0 180 140" className="h-32 w-40" aria-hidden="true">
      <circle cx="86" cy="70" r="54" fill="#e7f3e8" />
      {/* Accent rays */}
      <g stroke="#3d8b35" strokeWidth="2.8" strokeLinecap="round">
        <line x1="138" y1="26" x2="142" y2="16" />
        <line x1="147" y1="33" x2="155" y2="26" />
        <line x1="150" y1="44" x2="160" y2="41" />
      </g>
      {/* Document body */}
      <path
        d="M52 24h50l20 20v64a6 6 0 0 1-6 6H52a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6z"
        fill="#ffffff"
        stroke="#1b5933"
        strokeWidth="2.5"
      />
      <path d="M102 24v16a4 4 0 0 0 4 4h16" fill="#e6f2e7" stroke="#1b5933" strokeWidth="2.2" />
      {/* Format pill */}
      <rect x="40" y="34" width="42" height="19" rx="5" fill="#1f6336" />
      <text
        x="61"
        y="47"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {badgeText}
      </text>
      {/* Grid */}
      <g fill="#d9eedb">
        <rect x="56" y="62" width="16" height="7" rx="1.5" />
        <rect x="76" y="62" width="16" height="7" rx="1.5" />
        <rect x="96" y="62" width="16" height="7" rx="1.5" />
        <rect x="56" y="73" width="16" height="7" rx="1.5" />
        <rect x="76" y="73" width="16" height="7" rx="1.5" />
        <rect x="96" y="73" width="16" height="7" rx="1.5" />
        <rect x="56" y="84" width="16" height="7" rx="1.5" />
        <rect x="76" y="84" width="16" height="7" rx="1.5" />
        <rect x="56" y="95" width="16" height="7" rx="1.5" />
      </g>
      {/* Green check circle */}
      <circle cx="118" cy="96" r="19" fill="#4f9e36" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M110 96l5.5 5.5L127 90"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function FailedIllustration({ format = 'csv' }) {
  const badgeText = format === 'xlsx' ? 'XLSX' : 'CSV'
  return (
    <svg viewBox="0 0 180 140" className="h-32 w-40" aria-hidden="true">
      <circle cx="86" cy="70" r="54" fill="#fbeeee" />
      {/* Accent rays */}
      <g stroke="#d94f2b" strokeWidth="2.8" strokeLinecap="round">
        <line x1="136" y1="24" x2="140" y2="14" />
        <line x1="146" y1="32" x2="154" y2="25" />
        <line x1="150" y1="44" x2="160" y2="41" />
      </g>
      {/* Document body */}
      <path
        d="M52 24h50l20 20v64a6 6 0 0 1-6 6H52a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6z"
        fill="#ffffff"
        stroke="#1b5933"
        strokeWidth="2.5"
      />
      <path d="M102 24v16a4 4 0 0 0 4 4h16" fill="#e6f2e7" stroke="#1b5933" strokeWidth="2.2" />
      {/* Format pill */}
      <rect x="40" y="34" width="42" height="19" rx="5" fill="#1f6336" />
      <text
        x="61"
        y="47"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {badgeText}
      </text>
      {/* Grid */}
      <g fill="#d9eedb">
        <rect x="56" y="62" width="16" height="7" rx="1.5" />
        <rect x="76" y="62" width="16" height="7" rx="1.5" />
        <rect x="96" y="62" width="16" height="7" rx="1.5" />
        <rect x="56" y="73" width="16" height="7" rx="1.5" />
        <rect x="76" y="73" width="16" height="7" rx="1.5" />
        <rect x="56" y="84" width="16" height="7" rx="1.5" />
        <rect x="76" y="84" width="16" height="7" rx="1.5" />
        <rect x="56" y="95" width="16" height="7" rx="1.5" />
      </g>
      {/* Coral error circle */}
      <circle cx="118" cy="96" r="19" fill="#dd4e2c" stroke="#ffffff" strokeWidth="3" />
      <path
        d="M111 89l14 14m0-14l-14 14"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

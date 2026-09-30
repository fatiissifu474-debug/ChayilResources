/** Hand-drawn SVG scenes (no external images): books, classroom, school. */

export function BooksArt() {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label="Stack of books" className="h-auto w-full">
      <ellipse cx="100" cy="146" rx="70" ry="10" fill="#f4f4f5" />
      <rect x="45" y="112" width="110" height="26" rx="4" fill="#92400e" />
      <rect x="45" y="112" width="14" height="26" rx="4" fill="#78350f" />
      <rect x="63" y="118" width="80" height="4" rx="2" fill="#fef3c7" />
      <rect x="63" y="126" width="60" height="4" rx="2" fill="#fbbf24" />
      <rect x="55" y="86" width="100" height="26" rx="4" fill="#b45309" />
      <rect x="141" y="86" width="14" height="26" rx="4" fill="#78350f" />
      <rect x="63" y="92" width="70" height="4" rx="2" fill="#fef3c7" />
      <rect x="63" y="100" width="50" height="4" rx="2" fill="#fde68a" />
      <rect x="65" y="58" width="90" height="28" rx="4" fill="#047857" />
      <rect x="65" y="58" width="14" height="28" rx="4" fill="#065f46" />
      <rect x="83" y="64" width="60" height="5" rx="2.5" fill="#fef3c7" />
      <rect x="83" y="73" width="42" height="5" rx="2.5" fill="#a7f3d0" />
      <circle cx="158" cy="40" r="14" fill="#f59e0b" />
      <path d="M40 52 l6 -12 6 12 12 6 -12 6 -6 12 -6 -12 -12 -6 z" fill="#fbbf24" />
    </svg>
  );
}

export function ClassroomArt() {
  return (
    <svg viewBox="0 0 240 170" role="img" aria-label="Classroom scene" className="h-auto w-full">
      <rect x="0" y="0" width="240" height="170" rx="12" fill="#fffbeb" />
      <rect x="18" y="14" width="150" height="70" rx="6" fill="#064e3b" />
      <rect x="18" y="14" width="150" height="70" rx="6" fill="none" stroke="#78350f" strokeWidth="6" />
      <text x="40" y="45" fontFamily="cursive" fontSize="20" fill="#fef3c7">2 + 2 = 4</text>
      <text x="40" y="70" fontFamily="cursive" fontSize="16" fill="#a7f3d0">a, b, c…</text>
      <rect x="178" y="14" width="44" height="44" rx="6" fill="#e0f2fe" />
      <circle cx="200" cy="32" r="10" fill="#f59e0b" />
      <path d="M178 44 h44 M188 14 v44 M200 14 v44 M212 14 v44 M178 28 h44" stroke="#fff" strokeWidth="3" />
      <rect x="30" y="110" width="60" height="12" rx="3" fill="#92400e" />
      <rect x="36" y="122" width="8" height="26" fill="#78350f" />
      <rect x="76" y="122" width="8" height="26" fill="#78350f" />
      <rect x="110" y="110" width="60" height="12" rx="3" fill="#b45309" />
      <rect x="116" y="122" width="8" height="26" fill="#78350f" />
      <rect x="156" y="122" width="8" height="26" fill="#78350f" />
      <rect x="42" y="96" width="36" height="14" rx="2" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
      <rect x="122" y="96" width="36" height="14" rx="2" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
      <rect x="185" y="100" width="30" height="48" rx="4" fill="#047857" />
      <rect x="190" y="108" width="20" height="14" rx="2" fill="#fff" />
    </svg>
  );
}

export function SchoolArt() {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label="School building" className="h-auto w-full">
      <circle cx="160" cy="30" r="16" fill="#fbbf24" />
      <ellipse cx="45" cy="30" rx="22" ry="10" fill="#e0f2fe" />
      <ellipse cx="65" cy="36" rx="18" ry="9" fill="#bae6fd" />
      <rect x="30" y="75" width="140" height="65" rx="4" fill="#fef3c7" />
      <rect x="30" y="75" width="140" height="65" rx="4" fill="none" stroke="#92400e" strokeWidth="4" />
      <polygon points="20,78 100,30 180,78" fill="#b45309" />
      <rect x="96" y="10" width="4" height="26" fill="#78350f" />
      <polygon points="100,10 124,17 100,24" fill="#047857" />
      <rect x="55" y="95" width="26" height="22" rx="2" fill="#e0f2fe" stroke="#92400e" strokeWidth="3" />
      <rect x="119" y="95" width="26" height="22" rx="2" fill="#e0f2fe" stroke="#92400e" strokeWidth="3" />
      <rect x="88" y="105" width="24" height="35" rx="2" fill="#78350f" />
      <circle cx="100" cy="124" r="2.5" fill="#fbbf24" />
      <rect x="0" y="140" width="200" height="20" fill="#047857" opacity="0.25" />
    </svg>
  );
}

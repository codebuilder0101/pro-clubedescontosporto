import { useId } from "react";

export type ArtKind = "tasca" | "bar" | "evento" | "cultura" | "surf" | "cafe" | "vinho" | "ribeira";

/**
 * Flat illustrations used as offer imagery until partners upload photos.
 * Ported from the prototype's art() generator. The markup is built only from
 * constants in this file (no user input), so injecting it is safe.
 */
export function OfferArt({ kind, className }: { kind: ArtKind; className?: string }) {
  // useId may contain characters that are invalid in url(#…) references.
  const k = `a${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
      dangerouslySetInnerHTML={{ __html: artMarkup(kind, k) }}
    />
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function artMarkup(kind: ArtKind, k: string): string {
  const g = (id: string, a: string, b: string, x2 = "0", y2 = "1") =>
    `<linearGradient id="${k}${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rg = (id: string, a: string, b: string) =>
    `<radialGradient id="${k}${id}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>`;
  const grain = `<filter id="${k}g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0"/></filter>`;

  let d = "";
  let b = "";

  switch (kind) {
    case "tasca": {
      d = g("t", "#C8673D", "#7C3216", "1", "1") + g("s", "#F2A23A", "#C8571C") + rg("c", "#FFD27A", "#FFD27A");
      const tiles = range(10)
        .map(
          (i) =>
            `<g transform="translate(${i * 40} 0)"><rect width="40" height="40" fill="#F3F6FC"/><circle cx="20" cy="20" r="11" fill="none" stroke="#1747A6" stroke-width="2.2"/><path d="M20 0q6 10 0 20q-6-10 0-20M20 40q6-10 0-20q-6 10 0 20M0 20q10-6 20 0q-10 6-20 0M40 20q-10-6-20 0q10 6 20 0" fill="#1747A6" opacity=".85"/></g>`,
        )
        .join("");
      const fries = range(9)
        .map(
          (i) =>
            `<rect x="${110 + i * 9}" y="${236 + (i % 3) * 4}" width="8" height="34" rx="2.5" fill="#F7C24A" transform="rotate(${-40 + i * 10} ${114 + i * 9} 252)"/>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}t)"/><path d="M0 40h400M0 120h400M0 200h400M0 280h400" stroke="#5E240F" stroke-opacity=".25" stroke-width="2"/>${tiles}<rect y="40" width="400" height="6" fill="#0F2D6B" opacity=".25"/>
<circle cx="335" cy="80" r="70" fill="url(#${k}c)" opacity=".55"/>
<ellipse cx="190" cy="195" rx="118" ry="86" fill="#000" opacity=".22"/>
<circle cx="185" cy="182" r="112" fill="#FBFBF7"/><circle cx="185" cy="182" r="112" fill="none" stroke="#1747A6" stroke-width="6" stroke-dasharray="3 9"/><circle cx="185" cy="182" r="90" fill="#F1F2EE"/>
${fries}
<path d="M128 120h112l6 86H124z" fill="#E9B26A"/><path d="M122 114h124c10 0 14 30 0 40-6 10-6 34 2 44-12 12-30 2-42 10-14-10-32 2-44-6-14 6-34 0-40-12 8-10 6-28-2-40-8-10-8-34 2-36z" fill="url(#${k}s)"/>
<ellipse cx="186" cy="146" rx="34" ry="26" fill="#FFF8EC"/><circle cx="190" cy="144" r="13" fill="#FFB21C"/><circle cx="186" cy="140" r="4" fill="#fff" opacity=".7"/>
<g transform="translate(330 205)"><ellipse rx="34" ry="12" cy="58" fill="#000" opacity=".2"/><path d="M-24-40h48c0 46-12 64-24 64s-24-18-24-64z" fill="#fff" fill-opacity=".55"/><path d="M-20-12h40c-2 26-10 34-20 34s-18-8-20-34z" fill="#7A1631"/><rect x="-2" y="22" width="4" height="34" fill="#fff" fill-opacity=".6"/></g>`;
      break;
    }
    case "bar": {
      d = g("n", "#2B1E6B", "#6B3FB8") + rg("p", "#FF7BC0", "#FF7BC0") + rg("y", "#FFC531", "#FFC531");
      const bokeh = range(22)
        .map(
          (i) =>
            `<circle cx="${(i * 73) % 400}" cy="${(i * 47) % 170}" r="${6 + (i % 5) * 4}" fill="${i % 3 ? "#FFC531" : "#FF8FCB"}" opacity="${(0.12 + (i % 4) * 0.06).toFixed(2)}"/>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}n)"/>${bokeh}<circle cx="300" cy="80" r="120" fill="url(#${k}p)" opacity=".5"/><circle cx="90" cy="60" r="90" fill="url(#${k}y)" opacity=".35"/>
<circle cx="300" cy="86" r="46" fill="none" stroke="#FFC531" stroke-width="5" opacity=".9"/><circle cx="300" cy="86" r="46" fill="none" stroke="#FFE8A0" stroke-width="12" opacity=".2"/>
<rect y="220" width="400" height="80" fill="#1A1245"/><rect y="216" width="400" height="8" fill="#C79A5B"/>
<g transform="translate(130 120)"><path d="M-56 0h112L6 70v60h-12V70z" fill="#fff" fill-opacity=".3"/><path d="M-44 10h88L0 54z" fill="#FF6B5A"/><rect x="-36" y="128" width="72" height="8" rx="4" fill="#fff" fill-opacity=".45"/><circle cx="42" cy="2" r="16" fill="#9BE36C" stroke="#E9FFD9" stroke-width="3"/></g>
<g transform="translate(250 150)"><rect x="-26" y="-50" width="52" height="118" rx="6" fill="#fff" fill-opacity=".28"/><rect x="-22" y="-14" width="44" height="78" rx="4" fill="#FFB21C"/><rect x="-22" y="-14" width="44" height="14" fill="#FFE29A"/><rect x="6" y="-78" width="5" height="90" rx="2" fill="#2BD5A2" transform="rotate(12)"/><circle cx="-6" cy="10" r="7" fill="#fff" fill-opacity=".6"/><circle cx="8" cy="30" r="5" fill="#fff" fill-opacity=".5"/></g>`;
      break;
    }
    case "evento": {
      d = g("e", "#132B6E", "#3E2C8F") + g("l", "#FFE59A", "#FFE59A00");
      const crowd = range(26)
        .map((i) => {
          const x = i * 16 + (i % 2) * 6;
          const h = 20 + ((i * 37) % 18);
          return `<circle cx="${x}" cy="${262 - h}" r="11" fill="#0B1A47"/><rect x="${x - 13}" y="${262 - h + 6}" width="26" height="60" rx="12" fill="#0B1A47"/>`;
        })
        .join("");
      const beams = [60, 140, 260, 340]
        .map(
          (x, i) =>
            `<path d="M${x} -10L${x - 70 + i * 20} 300H${x + 70 - i * 10}z" fill="url(#${k}l)" opacity=".45" transform="rotate(${(i - 1.5) * 8} ${x} 0)"/>`,
        )
        .join("");
      const stars = range(28)
        .map((i) => `<circle cx="${(i * 61) % 400}" cy="${(i * 29) % 120}" r="${1 + (i % 3)}" fill="#fff" opacity=".7"/>`)
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}e)"/>${beams}
<rect x="60" y="150" width="280" height="14" rx="4" fill="#FFC531"/><g transform="translate(200 100)"><circle r="14" fill="#08133A"/><path d="M-16 14h32l8 40h-48z" fill="#08133A"/><path d="M10 26l40-12 4 8-40 14z" fill="#B65A2C"/></g>
${stars}${crowd}`;
      break;
    }
    case "cultura": {
      d = g("w", "#F6F2EA", "#E6DED0");
      let tiles = "";
      for (let y = 0; y < 300; y += 50)
        for (let x = 0; x < 400; x += 50)
          tiles += `<g transform="translate(${x} ${y})"><rect width="50" height="50" fill="#F7F9FD" stroke="#C9D6EE"/><path d="M25 3q8 11 0 22q-8-11 0-22M25 47q8-11 0-22q-8 11 0 22M3 25q11-8 22 0q-11 8-22 0M47 25q-11-8-22 0q11 8 22 0" fill="#1F55B8"/><circle cx="25" cy="25" r="4" fill="#FFC531"/><path d="M0 0q10 2 10 10M50 0q-10 2-10 10M0 50q10-2 10-10M50 50q-10-2-10-10" fill="none" stroke="#1F55B8" stroke-width="2"/></g>`;
      b = `${tiles}<path d="M120 300V150a80 80 0 0 1 160 0v150z" fill="#0F2D6B"/><path d="M134 300V154a66 66 0 0 1 132 0v146z" fill="#2A4E9A"/><path d="M134 300V154a66 66 0 0 1 132 0v146z" fill="#FFC531" opacity=".25"/>
<g transform="translate(200 230)"><ellipse rx="40" ry="10" cy="58" fill="#000" opacity=".25"/><path d="M-26 -50h52c8 22 20 36 20 62 0 28-20 46-46 46s-46-18-46-46c0-26 12-40 20-62z" fill="#F4F6FB"/><path d="M-36 0h72M-40 20h80" stroke="#1747A6" stroke-width="6"/><path d="M-20 -50h40v-10h-40z" fill="#1747A6"/></g>`;
      break;
    }
    case "surf": {
      d = g("s", "#8EC9F5", "#FFE4A6") + g("w1", "#2A7FD0", "#1747A6") + rg("u", "#FFF1B8", "#FFF1B8");
      const gulls = range(3)
        .map(
          (i) =>
            `<path d="M${60 + i * 90} ${60 + i * 14}q8-8 16 0q8-8 16 0" fill="none" stroke="#14213D" stroke-width="2.5" stroke-linecap="round"/>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}s)"/><circle cx="290" cy="110" r="80" fill="url(#${k}u)"/><circle cx="290" cy="110" r="34" fill="#FFD25A"/>
<path d="M0 170q50-20 100 0t100 0 100 0 100 0v130H0z" fill="#5FB0EE"/><path d="M0 200q50-24 100 0t100 0 100 0 100 0v100H0z" fill="url(#${k}w1)"/><path d="M0 200q50-24 100 0t100 0 100 0 100 0" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>
<path d="M0 245q50-20 100 0t100 0 100 0 100 0v55H0z" fill="#F2D9A0"/>
<g transform="translate(110 190) rotate(-14)"><ellipse rx="22" ry="88" fill="#FFC531"/><ellipse rx="22" ry="88" fill="none" stroke="#fff" stroke-width="3"/><path d="M0-86V86" stroke="#D9653B" stroke-width="5"/></g>
${gulls}`;
      break;
    }
    case "cafe": {
      d = g("t", "#D9A06A", "#A9673A", "1", "1");
      const grainLines = range(10)
        .map(
          (i) =>
            `<path d="M0 ${i * 32 + 8}q200 ${i % 2 ? 14 : -10} 400 0" stroke="#7A4220" stroke-opacity=".18" stroke-width="2" fill="none"/>`,
        )
        .join("");
      const pastries = range(2)
        .map(
          (i) =>
            `<g transform="translate(${300 - i * 10} ${110 + i * 100})"><circle r="44" fill="#E59F3C"/><circle r="34" fill="#F7D27A"/><circle cx="-10" cy="-6" r="8" fill="#8A4A16" opacity=".75"/><circle cx="12" cy="8" r="6" fill="#8A4A16" opacity=".6"/><circle cx="4" cy="-14" r="4" fill="#8A4A16" opacity=".6"/></g>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}t)"/>${grainLines}
<ellipse cx="150" cy="168" rx="104" ry="96" fill="#000" opacity=".2"/><circle cx="145" cy="155" r="100" fill="#FBFAF6"/><circle cx="145" cy="155" r="100" fill="none" stroke="#1747A6" stroke-width="5" stroke-dasharray="2 8"/><circle cx="145" cy="155" r="60" fill="#fff"/><circle cx="145" cy="155" r="48" fill="#5A2E14"/><path d="M117 150q28-18 56 0" stroke="#E9C59A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M205 150h26a14 14 0 0 1 0 28h-24" stroke="#fff" stroke-width="12" fill="none"/>
${pastries}`;
      break;
    }
    case "vinho": {
      d = g("v", "#5A1E3A", "#2A0F25") + g("b", "#8B5A33", "#5E3A1E") + rg("l", "#FFC531", "#FFC531");
      const barrels = range(3)
        .map(
          (i) =>
            `<g transform="translate(${60 + i * 110} 210)"><ellipse rx="56" ry="70" fill="url(#${k}b)"/><path d="M-50-30h100M-56 0h112M-50 30h100" stroke="#2A1608" stroke-width="5"/><ellipse rx="22" ry="26" fill="#3A220F"/><circle r="6" fill="#C8A26A"/></g>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}v)"/><circle cx="80" cy="40" r="140" fill="url(#${k}l)" opacity=".3"/>
${barrels}
<g transform="translate(300 60)"><rect x="-15" y="0" width="30" height="40" rx="4" fill="#123A2A"/><path d="M-30 40h60v130a10 10 0 0 1-10 10h-40a10 10 0 0 1-10-10z" fill="#1C4A36"/><rect x="-28" y="80" width="56" height="54" rx="4" fill="#F4EBD6"/><path d="M-18 98h36M-14 110h28" stroke="#7A1631" stroke-width="4"/><rect x="-15" y="-8" width="30" height="10" rx="3" fill="#C8A26A"/></g>
<g transform="translate(190 120)"><path d="M-28-30h56c0 46-12 66-28 66s-28-20-28-66z" fill="#fff" fill-opacity=".35"/><path d="M-24 0h48c-3 26-12 34-24 34s-21-8-24-34z" fill="#9B1B3D"/><rect x="-2" y="36" width="4" height="40" fill="#fff" fill-opacity=".5"/><ellipse cy="78" rx="22" ry="5" fill="#fff" fill-opacity=".45"/></g>`;
      break;
    }
    case "ribeira": {
      d = g("s", "#7FB3EC", "#FFD99A") + g("r", "#2F64B8", "#143E8A");
      const cols = ["#D9653B", "#FFC531", "#F4F1EA", "#E58FA0", "#5E8FD8", "#F2A65A", "#FFFFFF", "#9ACD8A"];
      const houses = range(12)
        .map((i) => {
          const x = i * 34 - 4;
          const h = 70 + ((i * 53) % 60);
          const windows = range(3)
            .map(
              (r) =>
                `<rect x="${x + 7}" y="${222 - h + r * 22}" width="7" height="12" fill="#14213D" opacity=".55"/><rect x="${x + 20}" y="${222 - h + r * 22}" width="7" height="12" fill="#14213D" opacity=".55"/>`,
            )
            .join("");
          return `<rect x="${x}" y="${210 - h}" width="34" height="${h}" fill="${cols[i % cols.length]}"/><path d="M${x - 2} ${210 - h}l19-16 19 16z" fill="#B8502D"/>${windows}`;
        })
        .join("");
      const hangers = range(7)
        .map((i) => `<path d="M${170 + i * 34} 70v${20 + Math.abs(3 - i) * -6 + 40}" stroke="#1F3E80" stroke-width="3"/>`)
        .join("");
      const ripples = range(14)
        .map(
          (i) =>
            `<path d="M${(i * 53) % 400} ${230 + ((i * 17) % 60)}h${20 + (i % 3) * 14}" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>`,
        )
        .join("");
      b = `<rect width="400" height="300" fill="url(#${k}s)"/><circle cx="320" cy="90" r="30" fill="#FFE07A"/><path d="M150 120q130-110 260 0" fill="none" stroke="#1F3E80" stroke-width="10"/><path d="M140 70h270" stroke="#1F3E80" stroke-width="8"/>${hangers}
${houses}<rect y="206" width="400" height="10" fill="#9C8F7E"/><rect y="216" width="400" height="84" fill="url(#${k}r)"/>${ripples}
<g transform="translate(250 252)"><path d="M-60 0q60 26 120 0l-10 14h-100z" fill="#5A3416"/><rect x="-3" y="-64" width="5" height="64" fill="#3A220F"/><path d="M-30-60h56v46h-56z" fill="#F4EBD6"/></g>`;
      break;
    }
  }

  return `<defs>${d}${grain}</defs>${b}<rect width="400" height="300" filter="url(#${k}g)"/>`;
}

// Illustrative catalog art. These are not photographs of the merchant's stock.
export function productCategory(name: string): string {
  if (/brake|rotor/i.test(name)) return 'Brakes'
  if (/filter/i.test(name)) return 'Filters'
  if (/light|lamp/i.test(name)) return 'Lighting'
  if (/belt/i.test(name)) return 'Belts'
  return 'Other parts'
}

export function productArtwork(name: string, index: number): string {
  const id = `part-${index}`
  let shape: string
  if (/rotor/i.test(name)) {
    shape = `<ellipse cx="120" cy="142" rx="73" ry="9" fill="#d9dfe5"/><g transform="translate(120 83) rotate(-18)"><ellipse rx="66" ry="60" fill="url(#${id}-metal)" stroke="#98a2ad" stroke-width="2"/><ellipse rx="57" ry="51" fill="none" stroke="#e7ecf0" stroke-width="3"/><ellipse rx="48" ry="43" fill="none" stroke="#a5aeb7"/><ellipse rx="32" ry="30" fill="#69747f" stroke="#b7c0c8" stroke-width="5"/><ellipse rx="20" ry="19" fill="#d3d9df"/><ellipse rx="12" ry="11" fill="#49545e"/>${[0,72,144,216,288].map(a=>`<circle cx="${Math.sin(a*Math.PI/180)*25}" cy="${Math.cos(a*Math.PI/180)*23}" r="3.7" fill="#34404c"/>`).join('')}</g>`
  } else if (/pad/i.test(name)) {
    shape = `<ellipse cx="120" cy="144" rx="77" ry="8" fill="#d9dfe5"/><g transform="translate(36 32) rotate(-9 80 50)"><path d="M8 10h142l9 17v45H0V27Z" fill="#4c5660"/><path d="M14 20h127l8 17v27H5V37Z" fill="#242c34"/><path d="M14 20h127" stroke="#84909b" stroke-width="3"/><path d="M73 21v42" stroke="#121820" stroke-width="5"/></g><g transform="translate(59 89) rotate(8 70 20)"><path d="M9 0h116l8 15v27H0V15Z" fill="#646e78"/><path d="M13 7h107l7 10v18H6V17Z" fill="#303940"/></g>`
  } else if (/cabin|air filter/i.test(name)) {
    shape = `<ellipse cx="120" cy="143" rx="76" ry="8" fill="#d9dfe5"/><g transform="translate(48 24) skewY(-8)"><rect width="144" height="102" rx="4" fill="#333e48"/><rect x="7" y="7" width="130" height="88" fill="#f4efe4"/>${Array.from({length:16},(_,i)=>`<path d="M${12+i*7.7} 10v81" stroke="${i%2?'#d1c9b8':'#fffdf7'}" stroke-width="4"/>`).join('')}<rect x="7" y="7" width="130" height="88" fill="none" stroke="#e8deca" stroke-width="2"/></g>`
  } else if (/oil filter/i.test(name)) {
    shape = `<ellipse cx="120" cy="145" rx="52" ry="8" fill="#d9dfe5"/><path d="M79 48h82v75q0 16-41 16t-41-16Z" fill="url(#${id}-dark)"/><ellipse cx="120" cy="48" rx="41" ry="15" fill="url(#${id}-metal)" stroke="#87929e"/><ellipse cx="120" cy="48" rx="18" ry="8" fill="#2d3742"/><path d="M91 70v45M150 70v45" stroke="#8d9aa5" stroke-opacity=".4" stroke-width="3"/><path d="M81 107h78v15H81Z" fill="#d94032"/>`
  } else if (/belt/i.test(name)) {
    shape = `<ellipse cx="120" cy="145" rx="70" ry="8" fill="#d9dfe5"/><ellipse cx="120" cy="85" rx="63" ry="51" transform="rotate(-22 120 85)" fill="none" stroke="#222b33" stroke-width="15"/><ellipse cx="120" cy="85" rx="63" ry="51" transform="rotate(-22 120 85)" fill="none" stroke="#52606c" stroke-width="2"/><ellipse cx="120" cy="85" rx="57" ry="45" transform="rotate(-22 120 85)" fill="none" stroke="#77838e" stroke-width="1" stroke-dasharray="2 4"/>`
  } else if (/light|lamp/i.test(name)) {
    shape = `<ellipse cx="120" cy="144" rx="86" ry="8" fill="#d9dfe5"/><path d="M30 103 55 50q17-20 76-16l72 31-14 49-105 11Z" fill="#36414d" stroke="#9aa5af" stroke-width="3"/><path d="m42 99 23-43q17-12 63-9l60 24-9 32-94 10Z" fill="url(#${id}-metal)"/><ellipse cx="112" cy="79" rx="29" ry="25" fill="#65737e" stroke="#eff5fa" stroke-width="5"/><ellipse cx="112" cy="79" rx="18" ry="16" fill="#cce1ec"/><path d="m160 67 18 9-8 26-20 2Z" fill="#f2ad3b"/><path d="m67 55 51-7 56 23" stroke="white" stroke-opacity=".65" stroke-width="3" fill="none"/>`
  } else {
    shape = `<path d="m120 28 64 34v62l-64 32-64-32V62Z" fill="#d9e0e7" stroke="#8d9daa" stroke-width="2"/><path d="m56 62 64 33 64-33M120 95v61" fill="none" stroke="#8d9daa" stroke-width="2"/><path d="m88 44 65 34v21l-18 9V86L70 53Z" fill="#c63c30"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 170" aria-hidden="true"><defs><linearGradient id="${id}-metal" x2=".8" y2="1"><stop stop-color="#f5f8fa"/><stop offset=".35" stop-color="#bbc6d0"/><stop offset=".6" stop-color="#e8edf1"/><stop offset="1" stop-color="#8b98a5"/></linearGradient><linearGradient id="${id}-dark"><stop stop-color="#26323d"/><stop offset=".45" stop-color="#677784"/><stop offset="1" stop-color="#27323c"/></linearGradient></defs>${shape}</svg>`
}

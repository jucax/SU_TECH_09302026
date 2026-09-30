import { escapeHtml, formatDayOfWeek, formatHoursEntry, formatPriceCents } from '../format.js'
import type { VerifiedRecord } from '../schemas.js'

// Server-rendered HTML for a tenant's "front door for people". Deliberately
// not built by the React SPA: an AI crawler that doesn't execute JavaScript
// must still be able to read this page, which is the exact failure OneBridge
// exists to fix. Includes schema.org structured data (LocalBusiness + Offer)
// so both crawlers and AI systems have a machine-readable version of the same
// facts a human sees, and a footer pointing at llms.txt and the MCP endpoint
// for anything looking for a more direct AI-facing connection.

const DAY_NAME_TO_SCHEMA_ORG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function buildStructuredData(record: VerifiedRecord, origin: string, tenantSlug: string) {
  const openingHoursSpecification = record.hours
    .filter((h) => !h.closed && h.opensAt && h.closesAt)
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAME_TO_SCHEMA_ORG[h.dayOfWeek],
      opens: h.opensAt,
      closes: h.closesAt,
    }))

  const makesOffer = record.products.map((p) => ({
    '@type': 'Offer',
    price: (p.priceCents / 100).toFixed(2),
    priceCurrency: p.currency,
    availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemOffered: {
      '@type': 'Product',
      name: p.name,
      description: p.description ?? undefined,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: record.profile.name,
    url: `${origin}/site/${tenantSlug}`,
    openingHoursSpecification,
    makesOffer,
  }
}

export function renderSiteHtml(record: VerifiedRecord, origin: string): string {
  const name = escapeHtml(record.profile.name)
  const slug = record.profile.slug
  const structuredData = buildStructuredData(record, origin, slug)

  const productsHtml = record.products
    .map(
      (p) => `
      <li class="product">
        <div>
          <p class="product-name">${escapeHtml(p.name)}</p>
          ${p.compatibility ? `<p class="product-meta">${escapeHtml(p.compatibility)}</p>` : ''}
          ${p.description ? `<p class="product-desc">${escapeHtml(p.description)}</p>` : ''}
        </div>
        <div class="product-price-col">
          <p class="product-price">${formatPriceCents(p.priceCents, p.currency)}</p>
          <p class="product-avail ${p.available ? 'in-stock' : 'out-of-stock'}">${
            p.available ? 'In stock' : 'Unavailable'
          }</p>
        </div>
      </li>`,
    )
    .join('')

  const hoursHtml = [...record.hours]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map(
      (h) => `
      <li class="hours-row">
        <span>${formatDayOfWeek(h.dayOfWeek)}</span>
        <span>${escapeHtml(formatHoursEntry(h))}</span>
      </li>`,
    )
    .join('')

  const policiesHtml = record.policies
    .map(
      (p) => `
      <div class="policy">
        <h3>${escapeHtml(p.kind)}</h3>
        <p>${escapeHtml(p.body)}</p>
      </div>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <meta name="description" content="${name}: current products, hours, and policies." />
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  <style>
    :root {
      --navy: #091D3F;
      --blue: #408EEC;
      --orange: #F68835;
      --gray: #F5F6F8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Montserrat, Arial, sans-serif;
      background: var(--gray);
      color: var(--navy);
    }
    main { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
    h1 { font-size: 2rem; font-weight: 800; margin: 0 0 8px; }
    h2 { font-size: 1.25rem; font-weight: 700; margin: 40px 0 12px; }
    h3 { font-size: 1rem; font-weight: 700; margin: 0 0 4px; text-transform: capitalize; }
    ul { list-style: none; margin: 0; padding: 0; }
    section {
      background: white;
      border-radius: 16px;
      padding: 8px 20px;
      box-shadow: 0 1px 3px rgba(9, 29, 63, 0.08);
    }
    .product {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid rgba(9, 29, 63, 0.08);
    }
    .product:last-child { border-bottom: none; }
    .product-name { font-weight: 700; margin: 0; }
    .product-meta, .product-desc { font-size: 0.875rem; color: rgba(9, 29, 63, 0.6); margin: 2px 0 0; }
    .product-price-col { text-align: right; flex-shrink: 0; }
    .product-price { font-weight: 700; margin: 0; }
    .product-avail { font-size: 0.875rem; margin: 2px 0 0; }
    .in-stock { color: rgba(9, 29, 63, 0.6); }
    .out-of-stock { color: var(--orange); }
    .hours-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(9, 29, 63, 0.08);
      font-size: 0.9rem;
    }
    .hours-row:last-child { border-bottom: none; }
    .policy { padding: 16px 0; border-bottom: 1px solid rgba(9, 29, 63, 0.08); }
    .policy:last-child { border-bottom: none; }
    .policy p { margin: 0; font-size: 0.9rem; color: rgba(9, 29, 63, 0.7); }
    footer {
      margin-top: 48px;
      font-size: 0.8rem;
      color: rgba(9, 29, 63, 0.5);
      text-align: center;
    }
    footer a { color: var(--blue); }
  </style>
</head>
<body>
  <main>
    <h1>${name}</h1>

    <h2>Products</h2>
    <section><ul>${productsHtml}</ul></section>

    <h2>Hours</h2>
    <section><ul>${hoursHtml}</ul></section>

    <h2>Policies</h2>
    <section>${policiesHtml}</section>

    <footer>
      Business information kept accurate by OneBridge &middot;
      <a href="/site/${slug}/llms.txt">llms.txt</a> &middot;
      <a href="/site/${slug}/mcp">MCP for AI</a>
    </footer>
  </main>
</body>
</html>`
}

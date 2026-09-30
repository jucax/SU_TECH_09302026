import { escapeHtml, formatDayOfWeek, formatHoursEntry, formatPriceCents } from '../format.js'
import type { VerifiedRecord } from '../schemas.js'

// Server-rendered HTML for a tenant's "front door for people". Deliberately
// not built by the React SPA: an AI crawler that doesn't execute JavaScript
// must still be able to read this page, which is the exact failure OneBridge
// exists to fix. Includes schema.org structured data (LocalBusiness + Offer)
// so both crawlers and AI systems have a machine-readable version of the same
// facts a human sees, and a footer pointing at llms.txt and the MCP endpoint
// for anything looking for a more direct AI-facing connection.
//
// Styled per docs/WEBSITE_STYLE_PLAN.md section 8: a credible local-business
// catalog, not an internal admin screen. Facts remain in the HTML with
// JavaScript disabled; styling is a small inline stylesheet, not a Tailwind
// build dependency this route doesn't have access to.

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

  const productsHtml = record.products.length
    ? record.products
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
    : '<li class="empty">No products published yet.</li>'

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

  const policiesHtml = record.policies.length
    ? record.policies
        .map(
          (p) => `
      <div class="policy">
        <h3>${escapeHtml(p.kind)}</h3>
        <p>${escapeHtml(p.body)}</p>
      </div>`,
        )
        .join('')
    : '<p class="empty">No policies published.</p>'

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
      --orange: #F68835;
      --gray: #F5F6F8;
      --border: #DFE6EF;
      --secondary: #52627A;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Montserrat, Arial, sans-serif;
      background: var(--gray);
      color: var(--navy);
    }
    a { color: #1D4ED8; }
    header.site-header {
      background: var(--navy);
      color: white;
      padding: 28px 20px;
    }
    header.site-header .inner { max-width: 1080px; margin: 0 auto; }
    header.site-header h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 4px; }
    header.site-header p { margin: 0; color: rgba(255,255,255,0.65); font-size: 0.875rem; }
    header.site-header nav { margin-top: 16px; display: flex; gap: 20px; }
    header.site-header nav a { color: rgba(255,255,255,0.85); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
    header.site-header nav a:hover { text-decoration: underline; }

    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 20px 56px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 800px) {
      main { grid-template-columns: 1fr; }
    }

    h2 { font-size: 1.1rem; font-weight: 700; margin: 0 0 12px; }
    ul { list-style: none; margin: 0; padding: 0; }
    section.card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 18px rgba(9,29,63,0.04);
    }

    .product {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
    }
    .product:last-child { border-bottom: none; }
    .product-name { font-weight: 700; margin: 0; }
    .product-meta, .product-desc { font-size: 0.875rem; color: var(--secondary); margin: 2px 0 0; }
    .product-price-col { text-align: right; flex-shrink: 0; }
    .product-price { font-weight: 700; margin: 0; font-variant-numeric: tabular-nums; }
    .product-avail { font-size: 0.8rem; margin: 3px 0 0; font-weight: 600; }
    .in-stock { color: var(--secondary); }
    .out-of-stock { color: var(--orange); }

    .hours-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }
    .hours-row:last-child { border-bottom: none; }
    .policy { padding: 12px 0; border-bottom: 1px solid var(--border); }
    .policy:last-child { border-bottom: none; }
    .policy h3 { font-size: 0.9rem; font-weight: 700; margin: 0 0 4px; text-transform: capitalize; }
    .policy p { margin: 0; font-size: 0.875rem; color: var(--secondary); line-height: 1.5; }
    .empty { color: var(--secondary); font-size: 0.875rem; }

    footer {
      max-width: 1080px;
      margin: 0 auto;
      padding: 0 20px 40px;
      font-size: 0.8rem;
      color: var(--secondary);
      text-align: center;
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="inner">
      <h1>${name}</h1>
      <p>Published business information</p>
      <nav>
        <a href="#products">Products</a>
        <a href="#hours">Hours</a>
        <a href="#policies">Policies</a>
      </nav>
    </div>
  </header>

  <main>
    <div>
      <section class="card" id="products">
        <h2>Products</h2>
        <ul>${productsHtml}</ul>
      </section>
    </div>

    <div>
      <section class="card" id="hours">
        <h2>Hours</h2>
        <ul>${hoursHtml}</ul>
      </section>

      <section class="card" id="policies">
        <h2>Policies</h2>
        ${policiesHtml}
      </section>
    </div>
  </main>

  <footer>
    Published from business-approved information through OneBridge &middot;
    <a href="/site/${slug}/llms.txt">llms.txt</a> &middot;
    <a href="/site/${slug}/mcp">MCP for AI</a>
  </footer>
</body>
</html>`
}

import { escapeHtml, formatDayOfWeek, formatHoursEntry, formatPriceCents } from '../format.js'
import type { VerifiedRecord } from '../schemas.js'
import { productArtwork, productCategory } from './product-art.js'
import { storefrontStyle } from './storefront-style.js'

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

function faviconMimeType(href: string): string {
  if (href.endsWith('.svg')) return 'image/svg+xml'
  if (href.endsWith('.webp')) return 'image/webp'
  if (href.endsWith('.jpg') || href.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

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
  const slug = escapeHtml(record.profile.slug)
  const automotive = /auto|automotive|motor|car parts/i.test(record.profile.name)
  const structuredData = JSON.stringify(buildStructuredData(record, origin, record.profile.slug)).replace(/</g, '\\u003c')
  const logoHtml = record.profile.logoUrl
    ? `<img class="logo" src="${escapeHtml(record.profile.logoUrl)}" alt="${name} logo" />`
    : `<span class="wordmark">${name}</span>`
  const faviconHref = record.profile.logoUrl ?? '/brand/icon-square.png'
  const categories = [...new Set(record.products.map(p => automotive ? productCategory(p.name) : 'Catalog'))]
  const productsHtml = record.products.length ? record.products.map((p, index) => {
    const category = automotive ? productCategory(p.name) : 'Catalog'
    const searchText = escapeHtml([p.name, p.compatibility, p.description].filter(Boolean).join(' ').toLowerCase())
    return `<li class="product" data-category="${category}" data-search="${searchText}">
      <div class="product-art">${productArtwork(automotive ? p.name : '', index)}<span class="art-label">Illustration</span></div>
      <div class="product-body"><p class="product-type">${category}</p><h3 class="product-name">${escapeHtml(p.name)}</h3>
      <p class="product-meta"><span class="fitment-label">${automotive ? 'Vehicle compatibility' : 'Compatibility'}:</span> ${p.compatibility ? escapeHtml(p.compatibility) : 'Not specified'}</p>
      <div class="price-line"><p class="product-price">${escapeHtml(formatPriceCents(p.priceCents, p.currency))}</p><span class="product-avail ${p.available ? 'in-stock' : 'out-of-stock'}">${p.available ? '● In stock' : 'Unavailable'}</span></div>
      ${p.description ? `<details><summary>Product details</summary><p>${escapeHtml(p.description)}</p></details>` : ''}</div></li>`
  }).join('') : '<li class="empty">No products published yet.</li>'
  const hoursHtml = [...record.hours].sort((a,b) => a.dayOfWeek-b.dayOfWeek).map(h => `<li class="hours-row"><span>${formatDayOfWeek(h.dayOfWeek)}</span><span>${escapeHtml(formatHoursEntry(h))}</span></li>`).join('')
  const policiesHtml = record.policies.length ? record.policies.map(p => `<div class="policy"><h3>${escapeHtml(p.kind)}</h3><p>${escapeHtml(p.body)}</p></div>`).join('') : '<p class="catalog-count">No policies published.</p>'
  const categoryButtons = categories.length > 1 ? `<div class="categories" role="group" aria-label="Filter product category"><button type="button" data-filter="all" aria-pressed="true">All parts</button>${categories.map(category => `<button type="button" data-filter="${category}" aria-pressed="false">${category}</button>`).join('')}</div>` : ''

  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="icon" type="${faviconMimeType(faviconHref)}" href="${escapeHtml(faviconHref)}"/><title>${name} | ${automotive ? 'Parts, compatibility & store information' : 'Products & store information'}</title>
<link rel="canonical" href="${escapeHtml(origin)}/site/${slug}"/><link rel="alternate" type="text/plain" title="Business-approved facts for AI" href="${escapeHtml(origin)}/site/${slug}/llms.txt"/>
<meta name="description" content="${name}: browse current products, prices, compatibility, hours, and business policies."/>
<script type="application/ld+json">${structuredData}</script><style>${storefrontStyle}</style></head>
<body class="${automotive ? 'automotive' : 'neutral'}"><a class="skip" href="#products">Skip to products</a>
<div class="utility"><div class="container"><span>${name}</span><span>Current catalog · Business-approved information</span></div></div>
<header class="site-header"><div class="container header-inner"><a href="#" aria-label="${name} home">${logoHtml}</a><nav class="header-nav" aria-label="Store navigation"><a href="#products">${automotive ? 'Shop parts' : 'Products'}</a><a href="#policies">Store policies</a><a class="header-link" href="#hours">Store hours ↗</a></nav></div></header>
<div class="brandbar"><nav class="container" aria-label="Catalog navigation"><a href="#products">${automotive ? 'Browse the parts catalog' : 'Browse the catalog'}</a><a href="#hours">Plan your visit</a><span>Prices and stock from the store’s approved record</span></nav></div>
<section class="hero" aria-labelledby="store-title">${automotive ? '<img class="hero-photo" src="/storefront/automotive-hero.png" alt="Illustrative graphite sedan in an automotive workshop"/>' : ''}<div class="container"><div class="hero-copy"><p class="eyebrow">${name}</p><h1 id="store-title">${automotive ? 'Your next repair<br/>starts here.' : 'Find what you need.<br/>Know before you go.'}</h1><p>${automotive ? 'Explore the parts catalog, check listed vehicle compatibility, and see current prices and availability before your visit.' : 'Explore current products, prices, availability, and store information in one place.'}</p><div class="hero-actions"><a class="button" href="#products">${automotive ? 'Find your parts' : 'Browse products'} <span aria-hidden="true">→</span></a><a class="button secondary" href="#hours">View store hours</a></div></div></div>${automotive ? '<span class="image-note">Illustrative automotive imagery</span>' : ''}</section>
<main><div class="container"><div class="benefits"><div class="benefit"><span class="benefit-icon" aria-hidden="true">↗</span><div><strong>${automotive ? 'Check vehicle compatibility' : 'Check product details'}</strong><small>Review the information before you visit.</small></div></div><div class="benefit"><span class="benefit-icon" aria-hidden="true">✓</span><div><strong>Know the price and stock</strong><small>See the store’s current catalog record.</small></div></div><div class="benefit"><span class="benefit-icon" aria-hidden="true">≡</span><div><strong>Understand store policies</strong><small>Hours and policies, clearly listed.</small></div></div></div>
<section id="products" class="catalog" aria-labelledby="products-title"><div class="section-top"><div><p class="eyebrow">${automotive ? 'THE PARTS COUNTER, ONLINE' : 'EXPLORE THE CATALOG'}</p><h2 id="products-title">${automotive ? 'Parts for your next project' : 'Our products'}</h2></div><p class="catalog-count" id="product-count" role="status">${record.products.length} listed ${record.products.length === 1 ? 'product' : 'products'}</p></div>
<div class="catalog-tools" id="catalog-tools" hidden><div class="search"><label for="catalog-search">SEARCH THE CATALOG</label><input id="catalog-search" type="search" placeholder="${automotive ? 'Search part name or listed vehicle compatibility' : 'Search products'}" autocomplete="off"/></div>${categoryButtons}</div>
<ul class="products" id="product-list">${productsHtml}</ul><p class="no-results" id="no-results" hidden>No matching products. Try a different part name or compatibility term.</p></section>
<div class="store-info"><section id="hours" class="card"><p class="eyebrow" style="color:var(--accent)">PLAN YOUR VISIT</p><h2>Store hours</h2><ul class="hours-list">${hoursHtml || '<li class="catalog-count">No hours published.</li>'}</ul></section><section id="policies" class="card"><p class="eyebrow" style="color:var(--accent)">GOOD TO KNOW</p><h2>Store policies</h2>${policiesHtml}</section></div></div></main>
<footer class="site-footer"><div class="container footer-inner"><div><strong>${name}</strong><p>Published from business-approved information through OneBridge.</p></div><div class="footer-links"><a href="/site/${slug}/llms.txt">Business facts · llms.txt</a><a href="/site/${slug}/llms.txt">MCP connection details</a><a href="/robots.txt">Crawler policy</a></div></div></footer>
<script>
(function(){
  var tools=document.getElementById('catalog-tools');
  var input=document.getElementById('catalog-search');
  var cards=Array.from(document.querySelectorAll('.product'));
  var buttons=Array.from(document.querySelectorAll('[data-filter]'));
  var category='all';
  if(!cards.length)return;
  tools.hidden=false;
  function filter(){
    var query=input.value.trim().toLowerCase();var count=0;
    cards.forEach(function(card){var match=(!query||card.dataset.search.includes(query))&&(category==='all'||card.dataset.category===category);card.hidden=!match;if(match)count++;});
    document.getElementById('product-count').textContent=count+' of '+cards.length+' products';
    document.getElementById('no-results').hidden=count!==0;
  }
  input.addEventListener('input',filter);
  buttons.forEach(function(button){button.addEventListener('click',function(){category=button.dataset.filter;buttons.forEach(function(item){item.setAttribute('aria-pressed',String(item===button));});filter();});});
})();
</script></body></html>`
}

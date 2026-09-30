# Jorge’s automotive storefront

`index.html` previews the actual storefront generator with the six demo inventory products and demo policies. Open it in a browser. Published pages continue to use each business’s approved record, uploaded logo, hours, and policies. Search and category filters progressively enhance the server-rendered catalog; product facts remain readable without JavaScript.

## Design references

- [AutoZone](https://www.autozone.com/): prominent product search, vehicle compatibility, category navigation, and clear availability.
- [NAPA](https://www.napaonline.com/): automotive retail catalog presentation.

The layout, SVG logo, and product illustrations are original. Illustrations are labeled and do not claim to be photographs of the listed products. No checkout, reviews, address, or promotions have been invented.

## Hero asset provenance

Generated with built-in image generation. Repository asset: `public/storefront/automotive-hero.png`.

Prompt:

> Photorealistic commercial automotive website hero photograph, wide landscape 2.5:1. A graphite gray generic unbranded sporty sedan viewed front three-quarter angle in a tasteful independent mechanic garage, right two thirds of frame. Crisp headlights, natural black rubber tire, realistic paint reflections and workshop details. Moody charcoal interior, warm red accent light, subtle daylight from side garage window, premium editorial car photography, controlled contrast. Left third dark negative space for overlay typography. No people, no visible logos, no license plate numbers, no letters, no text, no watermark. This is illustrative brand imagery for a fictional local auto-parts store, no identifiable automobile trademarks.

## Updating an existing demo

The revised logo is `public/demo/jorges-logo.svg`. An already-uploaded logo is stored independently: choose **Use Jorge’s logo** and publish again to replace it. The redesigned renderer applies when the storefront is served after deployment.

## Verification

Production build passed. Desktop and 500px responsive screenshots inspected. Preview contains all six product offers in JSON-LD; owner-supplied script-like text remains escaped in HTML and valid in structured data.

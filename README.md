# LayerCraft 3D Website

## What is fixed

This version is built to work when you double-click the HTML files on Windows **and** when deployed to GitHub Pages.

- Boys product: Hulk Fist Pen Holder — ₹249
- 3 real product images included
- View Details works
- View All works
- Add to Cart works
- Cart quantity and remove work
- LocalStorage cart works
- Customer checkout works
- WhatsApp order message is generated from the cart
- Direct-file (`file://`) testing works using `data/catalog-fallback.js`
- GitHub Pages loads the editable `data/products.json`

## Product management

Edit:

`data/products.json`

For GitHub Pages, the website reads this JSON file.

Because browsers block `fetch()` from local `file://` pages, direct double-click testing uses:

`data/catalog-fallback.js`

If you change products while testing only by double-clicking the files, regenerate/update `catalog-fallback.js` from the same catalogue. Once the site is deployed to GitHub Pages, changes to `products.json` are picked up automatically.

## Product images

Put product images in:

`images/products/`

The current product uses:

- `hulk-fist-pen-holder-1.png`
- `hulk-fist-pen-holder-2.png`
- `hulk-fist-pen-holder-3.png`

## WhatsApp

The central number is in:

`js/app.js`

```js
const CONFIG = { WHATSAPP_NUMBER: "919821434440" };
```

## Recommended testing

You can now double-click `index.html`.

Test this exact flow:

1. Open `index.html`
2. Click Boys → View all
3. Click View Details
4. Click Add to Cart
5. Open Cart
6. Change quantity
7. Click Order on WhatsApp
8. Enter customer details
9. Open WhatsApp

For GitHub Pages, upload the entire folder and enable Pages for the repository.


## Critical catalogue fix (FIX2)

The catalogue loader now correctly treats product data as an object with `boys` and `girls` arrays.
The previous build incorrectly checked `.length` on the catalogue object, which caused the
"We couldn't load our gift collection" message even though the fallback catalogue was present.

Build marker: `LC3D-2026-08-19-FIX2`

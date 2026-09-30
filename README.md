# AR Card

This is a simple WebAR app that shows an illustration when a Hiro marker is recognized.

## Files

- `index.html` — AR scene and marker setup
- `style.css` — page styling
- `app.js` — small startup script
- `illustration.png` — image displayed on the marker

## How to use on iPhone

1. Publish the repo via GitHub Pages, or serve it locally with a simple static server.
2. Open the page from your iPhone browser.
3. Point the phone camera at a Hiro marker.
4. The illustration will appears when the marker is detected.

## Hiro marker

A standard Hiro marker is used for the first version. It is the easiest way to test AR on a browser.

If you want to use your own custom card instead of Hiro later, we can convert `marker.png` into a custom AR pattern file.

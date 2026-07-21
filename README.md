# ComfyUI Anima Artist Selector

A visual artist selector for Anima workflows. It outputs a single artist handle as a ComfyUI `STRING` and provides matching desktop, mobile, and browser-library experiences.

## Features

- Browse and search the complete Anima artist catalog with style previews.
- Favorite artists and synchronize changes without reloading.
- Select manually, randomly, or deterministically from all artists or favorites using a seed.
- Keep a visual history of random selections.
- Sort by random order, name, work count, or uniqueness.
- Import Anima Style Explorer JSON or plain-text handle lists.
- Export handles and Explorer-compatible favorites.
- Use the native compact controls in mobile/non-canvas frontends.

Preview images are loaded on demand from the public `ThetaCursed/Anima-Assets` CDN. They are not included in this repository.

## Installation

Copy or clone the repository into `ComfyUI/custom_nodes/ComfyUI-Anima-Artist-Selector`, restart ComfyUI, and refresh the frontend.

Add **Samseys > Prompting > Anima Artist Selector** to a workflow. The standalone library is available at:

```text
http://localhost:8188/anima_artist_selector/browse
```

## Node inputs

- **Artist selection**: manual, seeded favorites, or seeded all artists.
- **Artist**: the manual handle used by Browse, Favorites, History, and Random.
- **Seed**: deterministic selection seed with ComfyUI's standard after-generate control.

The output includes the leading `@`.

## Project layout

```text
nodes.py                    Python node, persistence, routes, and SSE endpoint
web/anima_artist_selector.js  ComfyUI canvas integration and visual selectors
web/lib/catalog.js          Shared catalog loading, search, and seeded selection
web/lib/favorites.js        Shared favorite API and live-update client
web/browse.html             Standalone responsive library
web/icons/                  Locally bundled Lucide assets
web/artist-map.json         Artist metadata index
data/                       Runtime library and favorites (not committed)
```

## Development

Frontend changes normally require a hard refresh (`Ctrl+F5`). Python schema or route changes require a ComfyUI restart.

Run basic syntax checks with:

```powershell
python -m py_compile nodes.py
node --check web/anima_artist_selector.js
node --check web/lib/catalog.js
node --check web/lib/favorites.js
```

The node class ID, input names, route paths, and top-level frontend entrypoint are compatibility-sensitive.

## Credits

- Artist data and previews: [ThetaCursed/Anima-Style-Explorer](https://github.com/ThetaCursed/Anima-Style-Explorer) and [ThetaCursed/Anima-Assets](https://github.com/ThetaCursed/Anima-Assets)
- Interface icons: [Lucide](https://lucide.dev/)

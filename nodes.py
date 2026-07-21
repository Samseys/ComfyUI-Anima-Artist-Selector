import asyncio
import json
import urllib.error
import urllib.request
import zlib
from pathlib import Path

from aiohttp import web
from server import PromptServer


BASE = Path(__file__).resolve().parent
DATA_DIR = BASE / "data"
LIBRARY_FILE = DATA_DIR / "artists.json"
FAVORITES_FILE = DATA_DIR / "favorites.json"
INDEX_FILE = BASE / "web" / "artist-map.json"
INDEX_DOWNLOAD_FILE = INDEX_FILE.with_suffix(".json.download")
INDEX_META_FILE = INDEX_FILE.with_suffix(".json.meta")
INDEX_URL = "https://raw.githubusercontent.com/ThetaCursed/Anima-Style-Explorer/main/app/data.js"
BROWSE_FILE = BASE / "web" / "browse.html"
DEFAULTS = [
    "ask \\(askzy\\)", "mika pikazo", "namie-kun", "alchemaniac", "rynzfrancis",
    "cenm0", "yamasina009", "houraku", "kusunokimizuha",
]
FAVORITE_SUBSCRIBERS = set()


def _refresh_artist_index():
    """Conditionally refresh the generated catalog from the upstream explorer."""
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        metadata = json.loads(INDEX_META_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        metadata = {}

    headers = {"User-Agent": "ComfyUI-Anima-Artist-Selector"}
    if metadata.get("etag"):
        headers["If-None-Match"] = metadata["etag"]
    if metadata.get("last_modified"):
        headers["If-Modified-Since"] = metadata["last_modified"]

    try:
        request = urllib.request.Request(INDEX_URL, headers=headers)
        with urllib.request.urlopen(request, timeout=20) as response:
            source = response.read().decode("utf-8-sig")
            etag = response.headers.get("ETag")
            last_modified = response.headers.get("Last-Modified")

        prefix = "const galleryData ="
        if not source.lstrip().startswith(prefix) or not source.rstrip().endswith(";"):
            raise ValueError("upstream artist data has an unexpected format")
        payload = source.lstrip()[len(prefix):].strip()[:-1].strip()
        items = json.loads(payload)
        if not isinstance(items, list) or not items:
            raise ValueError("upstream artist catalog is empty")
        catalog = {
            str(item["id"]): item
            for item in items
            if isinstance(item, dict) and item.get("id") is not None and item.get("name")
        }
        if not catalog:
            raise ValueError("upstream artist catalog contains no valid artists")

        INDEX_DOWNLOAD_FILE.write_text(
            json.dumps(catalog, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        INDEX_DOWNLOAD_FILE.replace(INDEX_FILE)
        INDEX_META_FILE.write_text(
            json.dumps({"etag": etag, "last_modified": last_modified}, indent=2),
            encoding="utf-8",
        )
        print(f"[Anima Artist Selector] Updated artist catalog ({len(catalog):,} artists)")
    except urllib.error.HTTPError as error:
        if error.code != 304:
            print(f"[Anima Artist Selector] Could not update artist catalog: {error}")
    except Exception as error:
        INDEX_DOWNLOAD_FILE.unlink(missing_ok=True)
        print(f"[Anima Artist Selector] Could not update artist catalog: {error}")


_refresh_artist_index()


def _clean(value):
    return str(value or "").strip().lstrip("@").strip()


def _load_library():
    try:
        data = json.loads(LIBRARY_FILE.read_text(encoding="utf-8"))
        names = data.get("artists", [])
        return [x for x in (_clean(v) for v in names) if x]
    except (OSError, ValueError, TypeError):
        return list(DEFAULTS)


def _load_all_artist_names():
    try:
        data = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
        return [_clean(item.get("name")) for item in data.values() if isinstance(item, dict) and _clean(item.get("name"))]
    except (OSError, ValueError, TypeError):
        return _load_library()


def _seeded_choice(names, seed):
    if not names:
        return ""
    # CRC32 is stable across Python/JavaScript and avoids Python's salted hash.
    index = zlib.crc32(str(int(seed)).encode("utf-8")) % len(names)
    return names[index]


def _save_library(names, explorer_data=None):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    unique, seen = [], set()
    for raw in names:
        name = _clean(raw)
        key = name.casefold()
        if name and key not in seen:
            seen.add(key)
            unique.append(name)
    payload = {"artists": unique, "explorerData": explorer_data}
    LIBRARY_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return unique


def _load_favorites():
    try:
        data = json.loads(FAVORITES_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"favorites": []}
    except (OSError, ValueError, TypeError):
        return {"metadata": {"appName": "Anima Artist Selector"}, "favorites": []}


def _save_favorites(data):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    FAVORITES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _broadcast_favorites(data):
    for queue in tuple(FAVORITE_SUBSCRIBERS):
        try:
            if queue.full():
                queue.get_nowait()
            queue.put_nowait(data)
        except (asyncio.QueueEmpty, asyncio.QueueFull):
            pass


routes = PromptServer.instance.routes


@routes.get("/anima_artist_selector/browse")
async def browse(_request):
    return web.FileResponse(BROWSE_FILE)


@routes.get("/anima_artist_selector/library")
async def get_library(_request):
    artists = _load_library()
    try:
        saved = json.loads(LIBRARY_FILE.read_text(encoding="utf-8"))
        explorer_data = saved.get("explorerData")
    except (OSError, ValueError, TypeError):
        explorer_data = None
    return web.json_response({"artists": artists, "explorerData": explorer_data})


@routes.post("/anima_artist_selector/import")
async def import_library(request):
    body = await request.json()
    filename = str(body.get("filename", "")).lower()
    content = str(body.get("content", ""))
    explorer_data = None
    if filename.endswith(".json"):
        explorer_data = json.loads(content)
        favorites = explorer_data.get("favorites")
        if not isinstance(favorites, list):
            raise web.HTTPBadRequest(text="JSON has no favorites array")
        index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
        names = [index.get(str(f.get("id")), {}).get("name") for f in favorites if isinstance(f, dict)]
    else:
        names = content.splitlines()
    artists = _save_library(names, explorer_data)
    if not artists:
        raise web.HTTPBadRequest(text="No matching artists found")
    return web.json_response({"count": len(artists), "artists": artists})


@routes.post("/anima_artist_selector/save")
async def save_library(request):
    body = await request.json()
    artists = _save_library(body.get("artists", []), body.get("explorerData"))
    return web.json_response({"count": len(artists), "artists": artists})


@routes.get("/anima_artist_selector/favorites")
async def get_favorites(_request):
    return web.json_response(_load_favorites())


@routes.get("/anima_artist_selector/events")
async def favorite_events(request):
    response = web.StreamResponse(headers={
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })
    await response.prepare(request)
    queue = asyncio.Queue(maxsize=2)
    FAVORITE_SUBSCRIBERS.add(queue)
    try:
        initial = json.dumps(_load_favorites(), ensure_ascii=False)
        await response.write(f"event: favorites\ndata: {initial}\n\n".encode("utf-8"))
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=20)
                payload = json.dumps(data, ensure_ascii=False)
                await response.write(f"event: favorites\ndata: {payload}\n\n".encode("utf-8"))
            except asyncio.TimeoutError:
                await response.write(b": keepalive\n\n")
    except (ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        FAVORITE_SUBSCRIBERS.discard(queue)
    return response


@routes.post("/anima_artist_selector/favorite")
async def toggle_favorite(request):
    body = await request.json()
    name = _clean(body.get("name"))
    favorite = bool(body.get("favorite"))
    if not name:
        raise web.HTTPBadRequest(text="Missing artist name")
    data = _load_favorites()
    items = [x for x in data.get("favorites", []) if isinstance(x, dict)]
    items = [x for x in items if _clean(x.get("name")).casefold() != name.casefold()]
    if favorite:
        index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
        match = next((x for x in index.values() if _clean(x.get("name")).casefold() == name.casefold()), None)
        import time
        item = {"name": name, "timestamp": int(time.time() * 1000)}
        if match:
            item.update({"id": str(match.get("id")), "p": match.get("p")})
        items.insert(0, item)
    data = {
        "metadata": {
            "appName": "Anima Artist Selector",
            "favoritesCount": len(items),
        },
        "favorites": items,
    }
    _save_favorites(data)
    _broadcast_favorites(data)
    return web.json_response({"favorite": favorite, "count": len(items), "favorites": items})


class AnimaArtistSelector:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "selection_mode": (["Manual", "Seeded: favorites", "Seeded: all artists"], {
                    "default": "Manual",
                }),
                "artist": ("STRING", {
                    "default": "",
                    "placeholder": "Artist handle, e.g. @artist",
                }),
                "seed": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 0xffffffffffffffff,
                    "control_after_generate": True,
                }),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("artist_tag",)
    FUNCTION = "select"
    CATEGORY = "Samseys/Prompting"

    def select(self, selection_mode="Manual", artist="", seed=0):
        if selection_mode == "Seeded: all artists":
            tag = _seeded_choice(_load_all_artist_names(), seed)
        elif selection_mode == "Seeded: favorites":
            favorites = [_clean(item.get("name")) for item in _load_favorites().get("favorites", []) if isinstance(item, dict)]
            tag = _seeded_choice(favorites, seed)
        else:
            tag = _clean(artist)
        if not tag:
            return {"ui": {"artist": [""]}, "result": ("",)}
        value = "@" + tag
        return {"ui": {"artist": [value]}, "result": (value,)}


NODE_CLASS_MAPPINGS = {"SamseysAnimaArtistSelector": AnimaArtistSelector}
NODE_DISPLAY_NAME_MAPPINGS = {"SamseysAnimaArtistSelector": "Anima Artist Selector"}

import { app } from "/scripts/app.js";
import {
    PREVIEW_CDN as CDN,
    PREVIEW_RAW as RAW,
    cleanArtist as clean,
    loadCatalog as loadIndex,
    seededArtist as seededItem,
} from "./lib/catalog.js";
import {
    favoriteNameSet,
    loadFavorites,
    setFavorite,
    subscribeFavorites,
} from "./lib/favorites.js";

const MANAGER_URL = "/anima_artist_selector/browse";
const canvasRandomOrders = { all: [], favorites: [] };
function hideNativeWidget(widget) {
    if (!widget) return;
    widget.hidden = true;
    widget.options ||= {};
    widget.options.hidden = true;
    widget.computeSize = () => [0, -4];
}

function openPicker(selectArtist, favoriteNames = null) {
    const shade = document.createElement("div");
    shade.className = "samsey-anima-picker-shade";
    const favoritesMode = favoriteNames instanceof Set;
    let pickerFavorites = new Set(favoritesMode ? favoriteNames : []);
    const favoritesReady = loadFavorites().then(data => {
        pickerFavorites = favoriteNameSet(data.favorites || []);
    }).catch(() => {});
    shade.innerHTML = `<style>
      .samsey-anima-picker-shade{position:fixed!important;inset:0!important;z-index:100000!important;display:grid!important;place-items:center!important;padding:18px!important;background:#07080bc7!important;backdrop-filter:blur(8px)!important;box-sizing:border-box!important}
      .samsey-anima-picker{width:min(1160px,100%)!important;height:min(880px,94vh)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:1px solid #303139!important;border-radius:16px!important;background:#0f1014!important;color:#eee!important;box-shadow:0 24px 70px #000b!important;font:14px Inter,system-ui,sans-serif!important}
      .samsey-modal-icon{display:block!important;width:15px!important;height:15px!important;background:currentColor!important;mask:var(--icon) center/contain no-repeat!important;-webkit-mask:var(--icon) center/contain no-repeat!important}.samsey-modal-refresh{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/refresh-cw.svg')}.samsey-modal-close{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/x.svg')}.samsey-modal-heart{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/heart.svg')}
      .samsey-anima-picker-head{display:grid!important;grid-template-columns:auto minmax(220px,560px) 252px!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:14px 16px!important;border-bottom:1px solid #ffffff0d!important}.samsey-anima-picker-title{font-weight:650!important;white-space:nowrap!important}.samsey-anima-picker-head input{width:100%!important;min-width:0!important;height:42px!important;padding:0 14px!important;border:1px solid #303139!important;border-radius:11px!important;background:#18191f!important;color:#fff!important;outline:none!important}.samsey-anima-picker-head input:focus{border-color:#7569bb!important}.samsey-anima-picker-controls{display:grid!important;grid-template-columns:92px 88px 42px!important;align-items:center!important;gap:7px!important}.samsey-anima-picker-controls button,.samsey-anima-picker-controls select{box-sizing:border-box!important;width:100%!important;height:38px!important;min-height:38px!important;margin:0!important;padding:0 10px!important;border:1px solid #303139!important;border-radius:9px!important;background:#1a1b20!important;color:#ddd!important;cursor:pointer!important;white-space:nowrap!important;font:13px/1 Inter,system-ui,sans-serif!important}.samsey-anima-picker-controls button{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important}.samsey-anima-picker-controls select{appearance:none!important;text-align:center!important;text-align-last:center!important}.samsey-anima-picker-controls .shuffle.is-hidden{visibility:hidden!important;pointer-events:none!important}
      .samsey-anima-results{display:block!important;padding:16px!important;overflow:auto!important}.samsey-anima-picker-chunk{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;gap:14px!important;margin-bottom:14px!important}.samsey-anima-picker-chunk.is-restored .samsey-anima-card{animation:none!important;opacity:1!important}.samsey-anima-sentinel{height:1px!important;pointer-events:none!important}.samsey-anima-card{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:hidden!important;border:1px solid #ffffff10!important;border-radius:13px!important;background:#16171c!important;cursor:pointer!important;animation:samseyanima-in .35s cubic-bezier(.2,.75,.25,1) both!important;transition:border-color .2s!important}.samsey-anima-card:hover{border-color:#ffffff2b!important}.samsey-anima-card-media{position:relative!important}.samsey-anima-card img{box-sizing:border-box!important;display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:832/1216!important;object-fit:contain!important;background:#16171b!important}.samsey-anima-stat{position:absolute!important;left:9px!important;bottom:9px!important;padding:5px 7px!important;border:1px solid #ffffff1c!important;border-radius:7px!important;background:#111217d9!important;color:#eee!important;font:600 11px/1 Inter,system-ui,sans-serif!important;backdrop-filter:blur(8px)!important}.samsey-anima-card-heart{position:absolute!important;z-index:3!important;top:9px!important;right:9px!important;display:grid!important;place-items:center!important;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;margin:0!important;padding:0!important;border:1px solid #ffffff24!important;border-radius:50%!important;background:#15161dcc!important;color:#e8e8eb!important;font:19px/1 Arial,sans-serif!important;cursor:pointer!important;backdrop-filter:blur(10px)!important;transition:background .18s,border-color .18s!important}.samsey-anima-card-heart:hover{background:#202128!important}.samsey-anima-card-heart.on{border-color:#e85d8e80!important;background:#e85d8e!important;color:white!important}.samsey-anima-card-name{box-sizing:border-box!important;display:block!important;min-height:42px!important;padding:11px 12px!important;border-top:1px solid #ffffff0b!important;color:#e8e8eb!important;font:600 13px/1.35 Inter,system-ui,sans-serif!important;overflow-wrap:anywhere!important}.samsey-anima-empty{display:grid!important;place-items:center!important;min-height:55vh!important;color:#8c8e97!important;text-align:center!important}@keyframes samseyanima-in{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
      @media(max-width:650px){.samsey-anima-picker-shade{padding:7px!important}.samsey-anima-picker-head{grid-template-columns:1fr auto!important;padding:9px!important}.samsey-anima-picker-title{grid-column:1/2!important}.samsey-anima-picker-head input{grid-column:1/-1!important;grid-row:2!important}.samsey-anima-results{padding:8px!important}.samsey-anima-picker-chunk{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-bottom:8px!important}.samsey-anima-picker-controls .shuffle{display:none!important}}
    </style><section class="samsey-anima-picker"><header class="samsey-anima-picker-head"><div class="samsey-anima-picker-title">${favoritesMode ? "Favorite artists" : "Browse artists"}</div><input type="search" placeholder="${favoritesMode ? "Search favorites" : "Search 42,509 artists"}"><div class="samsey-anima-picker-controls"><select class="sort" title="Sort artists"><option value="random">Random</option><option value="name">Name</option><option value="works">Works</option><option value="unique">Unique</option></select><button class="shuffle"><span class="samsey-modal-icon samsey-modal-refresh" aria-hidden="true"></span><span>New mix</span></button><button class="close" title="Close" aria-label="Close"><span class="samsey-modal-icon samsey-modal-close" aria-hidden="true"></span></button></div></header><div class="samsey-anima-results"></div></section>`;
    document.body.append(shade);
    const panel = shade.querySelector(".samsey-anima-picker");
    const input = shade.querySelector("input");
    const sort = shade.querySelector(".sort");
    const results = shade.querySelector(".samsey-anima-results");
    let renderToken = 0;
    let activeItems = [], renderedCount = 0;
    const PAGE_SIZE = 40;
    let loadObserver, virtualObserver;
    const close = () => { loadObserver?.disconnect(); virtualObserver?.disconnect(); shade.remove(); };
    const sample = (items, count) => {
        const out = [], used = new Set();
        while (out.length < Math.min(count, items.length)) {
            const i = Math.floor(Math.random() * items.length);
            if (!used.has(i)) { used.add(i); out.push(items[i]); }
        }
        return out;
    };
    const bindPickerCards = container => {
        container.querySelectorAll(".samsey-anima-card").forEach(card => {
            card.onclick = () => { selectArtist(card.dataset.name); close(); };
            card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") card.click(); };
            const heartButton = card.querySelector(".samsey-anima-card-heart");
            heartButton.onclick = async event => {
                event.stopPropagation();
                const name = card.dataset.name, key = clean(name).toLowerCase(), favorite = !pickerFavorites.has(key);
                const data = await setFavorite(name, favorite);
                pickerFavorites = favoriteNameSet(data.favorites || []);
                if (favoritesMode) { favoriteNames.clear(); for (const item of pickerFavorites) favoriteNames.add(item); }
                if (favoritesMode && !favorite) card.remove();
                else {
                    heartButton.classList.toggle("on", favorite);
                    heartButton.title = favorite ? "Unfavorite" : "Favorite";
                    heartButton.setAttribute("aria-label", `${heartButton.title} @${name}`);
                }
            };
        });
        container.querySelectorAll("img").forEach(img => img.onerror = () => { if (!img.dataset.retry) { img.dataset.retry = "1"; img.src = img.src.replace("https://cdn.jsdelivr.net/gh/ThetaCursed/Anima-Assets@main", "https://raw.githubusercontent.com/ThetaCursed/Anima-Assets/main"); } });
    };
    const appendPickerPage = () => {
        if (renderedCount >= activeItems.length) return;
        const holder = document.createElement("div");
        holder.className = "samsey-anima-picker-chunk";
        const sentinel = results.querySelector(".samsey-anima-sentinel");
        results.insertBefore(holder, sentinel);
        const columns = Math.max(1, getComputedStyle(holder).gridTemplateColumns.split(" ").filter(Boolean).length);
        const pageSize = columns * Math.ceil(PAGE_SIZE / columns);
        const page = activeItems.slice(renderedCount, renderedCount + pageSize), start = renderedCount;
        renderedCount += page.length;
        holder._items = page;
        holder._start = start;
        holder._render = restored => {
            holder.classList.toggle("is-restored", restored);
            holder.innerHTML = holder._items.map((x, i) => { const itemKey=x._search, stat=sort.value === "works" ? `<span class="samsey-anima-stat">${Number(x.post_count || 0).toLocaleString()} works</span>` : sort.value === "unique" ? `<span class="samsey-anima-stat">uniqueness #${Number(x.uniqueness_rank).toLocaleString()}</span>` : ""; return `<article role="button" tabindex="0" class="samsey-anima-card" style="animation-delay:${Math.min(holder._start + i, 10) * 22}ms" data-name="${String(x.name).replaceAll('"', '&quot;')}"><div class="samsey-anima-card-media"><img loading="lazy" src="${CDN}/${x.p}/${x.id}.webp">${stat}<button class="samsey-anima-card-heart ${pickerFavorites.has(itemKey) ? "on" : ""}" title="${pickerFavorites.has(itemKey) ? "Unfavorite" : "Favorite"}" aria-label="${pickerFavorites.has(itemKey) ? "Unfavorite" : "Favorite"} @${x.name}"><span class="samsey-modal-icon samsey-modal-heart" aria-hidden="true"></span></button></div><span class="samsey-anima-card-name">@${x.name}</span></article>`; }).join("");
            bindPickerCards(holder);
        };
        holder._render(false);
        virtualObserver.observe(holder);
        requestAnimationFrame(() => {
            if (renderedCount < activeItems.length && sentinel?.getBoundingClientRect().top <= results.getBoundingClientRect().bottom + 900) appendPickerPage();
        });
    };
    const render = async (reshuffle = false) => {
        const token = ++renderToken;
        const q = clean(input.value).toLowerCase();
        const [{ all, search }] = await Promise.all([loadIndex(), favoritesReady]);
        if (token !== renderToken) return;
        let matches = search(q, favoritesMode ? favoriteNames : null);
        if (sort.value === "name") matches = [...matches].sort((a, b) => a.name.localeCompare(b.name));
        else if (sort.value === "works") matches = [...matches].sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
        else if (sort.value === "unique") matches = [...matches].sort((a, b) => (b.uniqueness_score || 0) - (a.uniqueness_score || 0));
        if (sort.value === "random" && !q) {
            const orderKey = favoritesMode ? "favorites" : "all";
            const randomOrder = canvasRandomOrders[orderKey];
            const available = new Map(matches.map(x => [String(x.id), x]));
            const retained = reshuffle ? [] : randomOrder.map(id => available.get(id)).filter(Boolean);
            const retainedIds = new Set(retained.map(x => String(x.id)));
            const added = sample(matches.filter(x => !retainedIds.has(String(x.id))), matches.length);
            activeItems = [...retained, ...added];
            canvasRandomOrders[orderKey] = activeItems.map(x => String(x.id));
        } else activeItems = matches;
        results.scrollTop = 0;
        renderedCount = 0;
        virtualObserver.disconnect();
        results.innerHTML = activeItems.length ? `<div class="samsey-anima-sentinel" aria-hidden="true"></div>` : `<div class="samsey-anima-empty">${favoritesMode ? "No favorite artists found." : "No artists found."}</div>`;
        appendPickerPage();
        const sentinel = results.querySelector(".samsey-anima-sentinel");
        if (sentinel) { loadObserver.disconnect(); loadObserver.observe(sentinel); }
    };
    loadObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) appendPickerPage(); }, { root: results, rootMargin: "900px 0px", threshold: 0 });
    virtualObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const chunk = entry.target;
            if (entry.isIntersecting && chunk.dataset.virtualized === "1") {
                chunk.dataset.virtualized = "0";
                chunk._render(true);
            } else if (!entry.isIntersecting && chunk.dataset.virtualized !== "1" && chunk.childElementCount) {
                const height = chunk.getBoundingClientRect().height;
                if (height > 0) {
                    chunk.style.height = `${height}px`;
                    chunk.innerHTML = "";
                    chunk.dataset.virtualized = "1";
                }
            }
        }
    }, { root: results, rootMargin: "1600px 0px", threshold: 0 });
    shade.querySelector(".close").onclick = close;
    const shuffleButton = shade.querySelector(".shuffle");
    shuffleButton.classList.toggle("is-hidden", favoritesMode);
    shuffleButton.onclick = () => render(true);
    sort.onchange = () => { shuffleButton.classList.toggle("is-hidden", sort.value !== "random" || favoritesMode); render(); };
    shade.onclick = e => { if (e.target === shade) close(); };
    panel.onclick = e => e.stopPropagation();
    input.oninput = render;
    const escape = e => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", escape); } };
    document.addEventListener("keydown", escape);
    render(); input.focus();
}

async function openRandomHistory(names, selectArtist) {
    if (!names.length) return;
    const { byName } = await loadIndex();
    const shade = document.createElement("div");
    shade.className = "samsey-anima-history-shade";
    shade.innerHTML = `<style>
      .samsey-anima-history-shade{position:fixed!important;inset:0!important;z-index:100000!important;display:grid!important;place-items:center!important;padding:18px!important;background:#07080bc7!important;backdrop-filter:blur(8px)!important;box-sizing:border-box!important}
      .samsey-anima-history-panel{box-sizing:border-box!important;width:min(1160px,100%)!important;height:min(880px,94vh)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:1px solid #303139!important;border-radius:16px!important;background:#0f1014!important;color:#eee!important;box-shadow:0 24px 70px #000b!important;font:14px Inter,system-ui,sans-serif!important}
      .samsey-anima-history-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:14px 16px!important;border-bottom:1px solid #ffffff0d!important}.samsey-anima-history-title{font-weight:650!important}.samsey-anima-history-close{display:grid!important;place-items:center!important;width:38px!important;height:36px!important;padding:0!important;border:1px solid #303139!important;border-radius:9px!important;background:#1a1b20!important;color:#ddd!important;cursor:pointer!important}.samsey-anima-history-close:before{content:""!important;width:15px!important;height:15px!important;background:currentColor!important;mask:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/x.svg') center/contain no-repeat!important;-webkit-mask:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/x.svg') center/contain no-repeat!important}
      .samsey-anima-history-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;align-content:start!important;gap:14px!important;padding:16px!important;overflow:auto!important}.samsey-anima-history-card{position:relative!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;align-self:start!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:1px solid #ffffff10!important;border-radius:13px!important;background:#16171c!important;color:#eee!important;text-align:left!important;cursor:pointer!important;transition:border-color .18s!important}.samsey-anima-history-card:hover{border-color:#ffffff2b!important}.samsey-anima-history-card img{box-sizing:border-box!important;display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:832/1216!important;object-fit:contain!important;background:#16171b!important}.samsey-anima-history-name{box-sizing:border-box!important;display:block!important;width:100%!important;min-height:42px!important;padding:11px 12px!important;border-top:1px solid #ffffff0b!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font:600 13px/1.35 Inter,system-ui,sans-serif!important}.samsey-anima-history-order{position:absolute!important;top:9px!important;left:9px!important;padding:5px 7px!important;border-radius:7px!important;background:#111217d9!important;color:#ddd!important;font:600 11px/1 Inter,system-ui,sans-serif!important}
      @media(max-width:650px){.samsey-anima-history-shade{padding:7px!important}.samsey-anima-history-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:8px!important;gap:8px!important}}
    </style><section class="samsey-anima-history-panel"><header class="samsey-anima-history-head"><div class="samsey-anima-history-title">Random history · ${names.length}</div><button class="samsey-anima-history-close" title="Close" aria-label="Close"></button></header><div class="samsey-anima-history-grid"></div></section>`;
    const close = () => shade.remove();
    const grid = shade.querySelector(".samsey-anima-history-grid");
    grid.innerHTML = names.map((name, index) => {
        const item = byName.get(clean(name).toLowerCase());
        const preview = item ? `<img loading="lazy" src="${CDN}/${item.p}/${item.id}.webp" alt="">` : "";
        return `<button class="samsey-anima-history-card" data-name="${clean(name).replaceAll('"', '&quot;')}">${preview}<span class="samsey-anima-history-order">${index === 0 ? "Latest" : `−${index}`}</span><span class="samsey-anima-history-name">@${clean(name)}</span></button>`;
    }).join("");
    grid.querySelectorAll(".samsey-anima-history-card").forEach(card => card.onclick = () => { selectArtist(card.dataset.name); close(); });
    grid.querySelectorAll("img").forEach(img => img.onerror = () => { if (!img.dataset.retry) { img.dataset.retry = "1"; img.src = img.src.replace("https://cdn.jsdelivr.net/gh/ThetaCursed/Anima-Assets@main", "https://raw.githubusercontent.com/ThetaCursed/Anima-Assets/main"); } });
    shade.querySelector(".samsey-anima-history-close").onclick = close;
    shade.onclick = event => { if (event.target === shade) close(); };
    shade.querySelector(".samsey-anima-history-panel").onclick = event => event.stopPropagation();
    document.body.append(shade);
}

app.registerExtension({
    name: "Samseys.AnimaArtistSelector",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "SamseysAnimaArtistSelector") return;
        const originalCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            originalCreated?.apply(this, arguments);
            const node = this;
            const removeHiddenInputMarkers = () => {
                const hiddenInputs = new Set(["seed_input", "artist", "selection_mode"]);
                for (let index = (node.inputs?.length || 0) - 1; index >= 0; index--) {
                    if (hiddenInputs.has(node.inputs[index]?.name)) node.removeInput(index);
                }
            };
            removeHiddenInputMarkers();
            // Workflow deserialization may restore inputs after onNodeCreated.
            setTimeout(removeHiddenInputMarkers, 0);
            const oldConfigure = node.onConfigure;
            node.onConfigure = function () {
                oldConfigure?.apply(this, arguments);
                setTimeout(removeHiddenInputMarkers, 0);
            };
            const artistWidget = node.widgets?.find(w => w.name === "artist");
            const modeWidget = node.widgets?.find(w => w.name === "selection_mode");
            const seedWidget = node.widgets?.find(w => w.name === "seed");
            hideNativeWidget(artistWidget);
            hideNativeWidget(modeWidget);

            let favorites = new Set();
            let favoriteItems = [];
            let derivedName = "";
            let randomHistory = [];
            let previewToken = 0;
            const currentName = () => clean(derivedName || artistWidget?.value);

            const root = document.createElement("div");
            root.innerHTML = `<style>
              .samsey-anima-node{width:100%;min-width:0;max-width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:6px;overflow:hidden;box-sizing:border-box;color:#ececf0;font:12px Inter,system-ui,sans-serif;user-select:none}
              .samsey-anima-preview{position:relative;display:grid;place-items:center;min-height:290px;flex:1 1 0;overflow:hidden;margin:0;padding:0;border:1px solid #ffffff14;border-radius:13px;background:#15161a;cursor:pointer}.samsey-anima-preview img{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;opacity:0;transition:opacity .22s}.samsey-anima-preview img.ready{opacity:1}.samsey-anima-empty{position:absolute;color:#777981;text-align:center;line-height:1.5}.samsey-anima-copyhint{position:absolute;left:50%;bottom:10px;translate:-50% 0;padding:6px 9px;border:1px solid #ffffff18;border-radius:8px;background:#111217dd;color:#ddd;opacity:0;transition:opacity .18s;white-space:nowrap;backdrop-filter:blur(8px)}.samsey-anima-preview:hover .samsey-anima-copyhint{opacity:1}
              .samsey-icon-asset{display:block!important;flex:0 0 auto!important;width:17px!important;height:17px!important;background:currentColor!important;mask:var(--icon) center/contain no-repeat!important;-webkit-mask:var(--icon) center/contain no-repeat!important}.samsey-icon-copy{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/copy.svg')}.samsey-icon-heart{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/heart.svg')}.samsey-icon-image{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/image.svg')}.samsey-icon-history{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/history.svg')}.samsey-icon-shuffle{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/shuffle.svg')}.samsey-icon-external{--icon:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/external-link.svg')}
              .samsey-anima-selected{box-sizing:border-box!important;display:flex!important;align-items:center!important;gap:4px!important;min-height:44px!important;padding:4px!important;border:1px solid #ffffff10!important;border-radius:11px!important;background:#17181d!important}.samsey-anima-handle{display:flex!important;align-items:center!important;flex:1!important;min-width:0!important;height:34px!important;padding:0 9px!important;color:#f0f0f2!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;box-sizing:border-box!important;font-weight:550!important}.samsey-anima-icon{box-sizing:border-box!important;display:grid!important;place-items:center!important;flex:0 0 34px!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;margin:0!important;padding:0!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#aaaeb8!important;cursor:pointer!important;transition:background .16s,color .16s,transform .16s!important}.samsey-anima-icon:hover{background:#ffffff0d!important;color:#f3f3f5!important}.samsey-anima-icon:active{transform:scale(.94)!important}.samsey-anima-heart.on{background:#e45d8d1c!important;color:#ef709d!important}
              .samsey-anima-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.samsey-anima-action{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;height:36px!important;min-height:36px!important;padding:0 10px!important;border:1px solid #ffffff12!important;border-radius:9px!important;background:#1a1b20!important;color:#e5e5e8!important;cursor:pointer!important;white-space:nowrap!important;transition:background .16s,border-color .16s,transform .16s!important}.samsey-anima-action .samsey-icon-asset{width:15px!important;height:15px!important}.samsey-anima-action:hover{background:#222329!important;border-color:#ffffff24!important}.samsey-anima-action:active{transform:scale(.98)}.samsey-anima-action:disabled{opacity:.38!important;cursor:default!important}.samsey-anima-action:disabled:active{transform:none}
              .samsey-anima-auto{display:block!important;margin-top:1px!important}.samsey-anima-field{position:relative!important;display:grid!important;gap:6px!important;min-width:0!important}.samsey-anima-field:after{content:""!important;position:absolute!important;right:12px!important;bottom:12px!important;width:14px!important;height:14px!important;background:#a7a8b0!important;mask:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/chevron-down.svg') center/contain no-repeat!important;-webkit-mask:url('/extensions/ComfyUI-Anima-Artist-Selector/icons/chevron-down.svg') center/contain no-repeat!important;pointer-events:none!important}.samsey-anima-label{padding-left:3px!important;color:#858893!important;font:600 9px/1.2 Inter,system-ui,sans-serif!important;letter-spacing:.08em!important;text-transform:uppercase!important}.samsey-anima-auto select{box-sizing:border-box!important;width:100%!important;height:38px!important;min-height:38px!important;margin:0!important;padding:0 38px 0 11px!important;border:1px solid #ffffff12!important;border-radius:9px!important;appearance:none!important;-webkit-appearance:none!important;background:#17181d!important;color:#ddd!important;font:12px Inter,system-ui,sans-serif!important}.samsey-anima-meta{box-sizing:border-box!important;min-height:14px!important;margin-top:-4px!important;padding:0 3px!important;color:#858893!important;font:10px/1.4 Inter,system-ui,sans-serif!important}
              .samsey-anima-manage{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:28px!important;margin-top:-2px!important;border:0!important;background:transparent!important;color:#858893!important;cursor:pointer!important}.samsey-anima-manage .samsey-icon-asset{width:13px!important;height:13px!important}.samsey-anima-manage:hover{color:#d7d7dc!important}
            </style><div class="samsey-anima-node"><button class="samsey-anima-preview" title="Copy selected handle"><span class="samsey-anima-empty">Choose an artist<br>to load a preview</span><img alt="Selected artist preview"><span class="samsey-anima-copyhint">Copy handle</span></button><div class="samsey-anima-selected"><div class="samsey-anima-handle">No artist selected</div><button class="samsey-anima-icon samsey-anima-copy" title="Copy handle" aria-label="Copy handle"><span class="samsey-icon-asset samsey-icon-copy" aria-hidden="true"></span></button><button class="samsey-anima-icon samsey-anima-heart" title="Favorite" aria-label="Favorite"><span class="samsey-icon-asset samsey-icon-heart" aria-hidden="true"></span></button></div><div class="samsey-anima-meta"></div><div class="samsey-anima-actions"><button class="samsey-anima-action samsey-anima-browse"><span class="samsey-icon-asset samsey-icon-image" aria-hidden="true"></span><span>Browse</span></button><button class="samsey-anima-action samsey-anima-random-fav"><span class="samsey-icon-asset samsey-icon-heart" aria-hidden="true"></span><span>Favorites</span></button><button class="samsey-anima-action samsey-anima-history" disabled><span class="samsey-icon-asset samsey-icon-history" aria-hidden="true"></span><span>History</span></button><button class="samsey-anima-action samsey-anima-random"><span class="samsey-icon-asset samsey-icon-shuffle" aria-hidden="true"></span><span>Random</span></button></div><div class="samsey-anima-auto"><label class="samsey-anima-field"><span class="samsey-anima-label">Artist selection</span><select class="samsey-anima-mode" title="Artist selection mode"><option>Manual</option><option>Seeded: favorites</option><option>Seeded: all artists</option></select></label></div><button class="samsey-anima-manage"><span>Open library · import · export</span><span class="samsey-icon-asset samsey-icon-external" aria-hidden="true"></span></button></div>`;
            root.style.width = "100%";
            root.style.height = "100%";
            root.addEventListener("pointerdown", e => e.stopPropagation());
            const preview = root.querySelector(".samsey-anima-preview");
            const image = root.querySelector("img");
            const empty = root.querySelector(".samsey-anima-empty");
            const handle = root.querySelector(".samsey-anima-handle");
            const heart = root.querySelector(".samsey-anima-heart");
            const meta = root.querySelector(".samsey-anima-meta");
            const mode = root.querySelector(".samsey-anima-mode");
            const historyButton = root.querySelector(".samsey-anima-history");
            mode.value = modeWidget?.value || "Manual";

            const copyHandle = async () => {
                const name = currentName();
                if (!name) return;
                const text = "@" + name;
                // navigator.clipboard only works in secure contexts (HTTPS/localhost); over a
                // plain-HTTP LAN IP it is undefined, so fall back to textarea + execCommand.
                if (navigator.clipboard && window.isSecureContext) {
                    try { await navigator.clipboard.writeText(text); return; } catch {}
                }
                const ta = document.createElement("textarea");
                ta.value = text; ta.setAttribute("readonly", "");
                ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
                document.body.appendChild(ta); ta.focus(); ta.select();
                try { ta.setSelectionRange(0, text.length); } catch {}
                try { document.execCommand("copy"); } catch {}
                ta.remove();
            };
            const updateFavorite = () => {
                const on = favorites.has(currentName().toLowerCase());
                heart.classList.toggle("on", on);
                heart.title = on ? "Unfavorite" : "Favorite";
                heart.setAttribute("aria-label", heart.title);
            };
            const updatePreview = async () => {
                const token = ++previewToken;
                const name = currentName();
                handle.textContent = name ? "@" + name : "No artist selected";
                image.classList.remove("ready");
                image.removeAttribute("src");
                empty.style.display = "block";
                updateFavorite();
                if (!name) return;
                const { byName } = await loadIndex();
                if (token !== previewToken) return;
                const item = byName.get(name.toLowerCase());
                if (!item) { meta.textContent = ""; empty.textContent = "Preview unavailable"; return; }
                meta.textContent = `${Number(item.post_count || 0).toLocaleString()} works  ·  uniqueness #${Number(item.uniqueness_rank).toLocaleString()}`;
                empty.style.display = "none";
                image.dataset.retry = "";
                image.onload = () => { if (token === previewToken) image.classList.add("ready"); };
                image.onerror = () => {
                    if (token !== previewToken) return;
                    if (!image.dataset.retry) { image.dataset.retry = "1"; image.src = `${RAW}/${item.p}/${item.id}.webp`; }
                    else { empty.textContent = "Preview unavailable"; empty.style.display = "block"; }
                };
                image.src = `${CDN}/${item.p}/${item.id}.webp`;
            };
            const selectArtist = name => {
                if (!name || !artistWidget) return;
                derivedName = "";
                mode.value = "Manual";
                if (modeWidget) { modeWidget.value = "Manual"; modeWidget.callback?.(modeWidget.value); }
                artistWidget.value = "@" + clean(name);
                artistWidget.callback?.(artistWidget.value);
                localStorage.setItem("samseys-anima-last-artist", clean(name));
                updatePreview();
            };
            const applyAutomatic = async () => {
                if (mode.value === "Manual") derivedName = "";
                else {
                    const pool = mode.value === "Seeded: favorites" ? favoriteItems.map(x => ({ name: clean(x.name) })) : (await loadIndex()).all;
                    derivedName = seededItem(pool, seedWidget?.value || 0)?.name || "";
                }
                updatePreview();
            };

            preview.onclick = copyHandle;
            root.querySelector(".samsey-anima-copy").onclick = copyHandle;
            root.querySelector(".samsey-anima-browse").onclick = () => openPicker(selectArtist, null);
            historyButton.onclick = () => openRandomHistory([...randomHistory].reverse(), selectArtist);
            root.querySelector(".samsey-anima-random").onclick = async () => {
                const { all } = await loadIndex();
                if (!all.length) return;
                const current = currentName().toLowerCase();
                let picked = all[Math.floor(Math.random() * all.length)]?.name;
                if (all.length > 1) while (clean(picked).toLowerCase() === current) picked = all[Math.floor(Math.random() * all.length)]?.name;
                randomHistory.push(clean(picked));
                if (randomHistory.length > 100) randomHistory.shift();
                historyButton.disabled = false;
                selectArtist(picked);
            };
            root.querySelector(".samsey-anima-random-fav").onclick = () => {
                if (!favorites.size) return alert("You have no favorite artists yet.");
                openPicker(selectArtist, favorites);
            };
            heart.onclick = async () => {
                const name = currentName();
                if (!name) return;
                const makeFavorite = !favorites.has(name.toLowerCase());
                const data = await setFavorite(name, makeFavorite).catch(() => null);
                if (!data) return alert("Could not update favorite.");
                favoriteItems = data.favorites || [];
                favorites = favoriteNameSet(favoriteItems);
                updateFavorite();
            };
            root.querySelector(".samsey-anima-manage").onclick = () => window.open(MANAGER_URL, "_blank");
            mode.onchange = () => {
                // Changing selection strategy must not also change the artist the
                // user is looking at. Persist that artist as the manual value so
                // switching back to Manual keeps it, then let the next execution
                // resolve a seeded mode and report its chosen artist normally.
                const selectedName = currentName();
                if (selectedName && artistWidget) {
                    artistWidget.value = "@" + clean(selectedName);
                    artistWidget.callback?.(artistWidget.value);
                    localStorage.setItem("samseys-anima-last-artist", clean(selectedName));
                }
                if (modeWidget) { modeWidget.value = mode.value; modeWidget.callback?.(modeWidget.value); }
                updatePreview();
            };

            const oldArtistCallback = artistWidget?.callback;
            if (artistWidget) artistWidget.callback = function () { oldArtistCallback?.apply(this, arguments); updatePreview(); };
            const oldExecuted = node.onExecuted;
            node.onExecuted = function (message) {
                oldExecuted?.call(this, message);
                const executedArtist = Array.isArray(message?.artist) ? message.artist[0] : message?.artist;
                if (executedArtist) {
                    derivedName = clean(executedArtist);
                    updatePreview();
                }
            };

            const ui = node.addDOMWidget("anima_artist_ui", "div", root, { serialize: false, hideOnZoom: false });
            ui.computeSize = () => {
                // ComfyUI may remeasure DOM widgets from their intrinsic content
                // width after a hidden native widget fires its callback. Keep the
                // overlay tied to the canvas node instead of accepting that stale
                // measurement, which otherwise makes it spill across other nodes.
                ui.width = node.size[0];
                return [node.size[0], 610];
            };
            node.setSize([380, 675]);
            node.minSize = [340, 625];
            const oldResize = node.onResize;
            node.onResize = function (size) {
                size[0] = Math.max(340, size[0]);
                size[1] = Math.max(625, size[1]);
                ui.width = size[0];
                root.style.width = "100%";
                root.style.maxWidth = "100%";
                oldResize?.call(this, size);
            };

            loadFavorites().then(data => {
                favoriteItems = data.favorites || [];
                favorites = favoriteNameSet(favoriteItems);
                updateFavorite();
                if (mode.value === "Seeded: favorites") applyAutomatic();
            });
            subscribeFavorites(items => {
                favoriteItems = items;
                favorites = favoriteNameSet(items);
                updateFavorite();
                if (mode.value === "Seeded: favorites") applyAutomatic();
            });
            setTimeout(() => {
                mode.value = modeWidget?.value || "Manual";
                if (!clean(artistWidget?.value)) {
                    const saved = localStorage.getItem("samseys-anima-last-artist");
                    if (saved && artistWidget) artistWidget.value = "@" + saved;
                }
                applyAutomatic();
            }, 0);
        };
    },
});

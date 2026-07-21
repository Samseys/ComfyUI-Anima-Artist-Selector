export const INDEX_URL = "/extensions/ComfyUI-Anima-Artist-Selector/artist-map.json";
export const PREVIEW_CDN = "https://cdn.jsdelivr.net/gh/ThetaCursed/Anima-Assets@main/base-images";
export const PREVIEW_RAW = "https://raw.githubusercontent.com/ThetaCursed/Anima-Assets/main/base-images";

let indexPromise;

export function cleanArtist(value) {
    return String(value || "").trim().replace(/^@/, "");
}

function createSearchEngine(all) {
    const postings = new Map();
    all.forEach((item, index) => {
        const grams = new Set();
        for (let i = 0; i <= item._search.length - 3; i++) grams.add(item._search.slice(i, i + 3));
        for (const gram of grams) {
            let list = postings.get(gram);
            if (!list) postings.set(gram, list = []);
            list.push(index);
        }
    });

    return (query, allowedNames = null) => {
        const normalized = cleanArtist(query).toLowerCase();
        const allowed = item => !allowedNames || allowedNames.has(item._search);
        if (!normalized) return all.filter(allowed);
        if (normalized.length < 3) return all.filter(item => allowed(item) && item._search.includes(normalized));

        const grams = [];
        for (let i = 0; i <= normalized.length - 3; i++) grams.push(normalized.slice(i, i + 3));
        const lists = grams.map(gram => postings.get(gram) || []).sort((a, b) => a.length - b.length);
        if (!lists[0]?.length) return [];

        const remaining = lists.slice(1).map(list => new Set(list));
        return lists[0].flatMap(index => {
            if (remaining.some(set => !set.has(index))) return [];
            const item = all[index];
            return allowed(item) && item._search.includes(normalized) ? [item] : [];
        });
    };
}

export function loadCatalog() {
    return indexPromise ||= fetch(INDEX_URL).then(response => {
        if (!response.ok) throw new Error(`Could not load artist catalog (${response.status})`);
        return response.json();
    }).then(data => {
        const all = Object.values(data).map(item => ({ ...item, _search: String(item.name).toLowerCase() }));
        [...all]
            .sort((a, b) => (b.uniqueness_score || 0) - (a.uniqueness_score || 0))
            .forEach((item, index) => item.uniqueness_rank = index + 1);
        return {
            all,
            byName: new Map(all.map(item => [item._search, item])),
            search: createSearchEngine(all),
        };
    });
}

function crc32(text) {
    let crc = -1;
    for (const char of String(text)) {
        crc ^= char.charCodeAt(0);
        for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
}

export function seededArtist(items, seed) {
    return items.length ? items[crc32(Math.trunc(Number(seed) || 0)) % items.length] : null;
}

export function previewUrl(item, raw = false) {
    return `${raw ? PREVIEW_RAW : PREVIEW_CDN}/${item.p}/${item.id}.webp`;
}

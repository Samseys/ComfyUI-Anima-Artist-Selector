import { cleanArtist } from "./catalog.js";

const listeners = new Set();
const events = new EventSource("/anima_artist_selector/events");

events.addEventListener("favorites", event => {
    try {
        const data = JSON.parse(event.data);
        for (const listener of listeners) listener(data.favorites || []);
    } catch (error) {
        console.warn("Anima favorites sync error", error);
    }
});

export function subscribeFavorites(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export async function loadFavorites() {
    const response = await fetch("/anima_artist_selector/favorites");
    if (!response.ok) throw new Error(`Could not load favorites (${response.status})`);
    return response.json();
}

export async function setFavorite(name, favorite) {
    const response = await fetch("/anima_artist_selector/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanArtist(name), favorite }),
    });
    if (!response.ok) throw new Error(`Could not update favorite (${response.status})`);
    return response.json();
}

export function favoriteNameSet(items) {
    return new Set(items.map(item => cleanArtist(item.name).toLowerCase()));
}

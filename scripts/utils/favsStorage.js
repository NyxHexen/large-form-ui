// Simple favourites storage with localStorage first, cookie fallback
const FAVS_KEY = "favFieldsList";

function parseList(val) {
  if (!val) return [];
  try {
    // Accept JSON array format if ever stored that way
    if (typeof val === "string" && val.trim().startsWith("[")) {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    }
  } catch (_) {
    // fall through to CSV parsing
  }
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    // CSV string
    return val
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length);
  }
  return [];
}

function readCookie(name) {
  const nameEq = `${name}=`;
  const parts = decodeURIComponent(document.cookie || "").split(";");
  for (let p of parts) {
    let c = p;
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(nameEq) === 0) return c.substring(nameEq.length);
  }
  return null;
}

function writeCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  // Include SameSite for safer defaults; Secure is only effective on HTTPS
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; ${expires}; path=/; SameSite=Lax`;
}

export function getFavs() {
  const ls = window.localStorage?.getItem(FAVS_KEY);
  if (ls) return parseList(ls);
  const ck = readCookie(FAVS_KEY);
  return parseList(ck);
}

export function setFavs(list) {
  const arr = Array.from(new Set(parseList(list)));
  const csv = arr.join(",");
  try {
    window.localStorage?.setItem(FAVS_KEY, csv);
  } catch (_) {
    // ignore quota errors
  }
  writeCookie(FAVS_KEY, csv);
  return arr;
}

export function toggleFav(id) {
  const current = new Set(getFavs());
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return setFavs(Array.from(current));
}

export function isFav(id) {
  return getFavs().includes(id);
}


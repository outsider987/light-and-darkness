const KEY = 'light-and-darkness:save1';

export function saveJSON(data: unknown): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadJSON<T>(): T | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

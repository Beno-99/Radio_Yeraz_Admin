export function getLocalStorageValue(key: string): string | null {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.getItem !== "function"
  ) {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function setLocalStorageValue(key: string, value: string): void {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.setItem !== "function"
  ) {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function removeLocalStorageValue(key: string): void {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.removeItem !== "function"
  ) {
    return;
  }

  window.localStorage.removeItem(key);
}

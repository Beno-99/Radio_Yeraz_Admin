export const LOCAL_STORAGE_CHANGE_EVENT = "radioyeraz:local-storage-change";

export function subscribeToLocalStorage(
  callback: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, callback);
  };
}

function dispatchLocalStorageChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_STORAGE_CHANGE_EVENT));
}

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
  dispatchLocalStorageChange();
}

export function removeLocalStorageValue(key: string): void {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage?.removeItem !== "function"
  ) {
    return;
  }

  window.localStorage.removeItem(key);
  dispatchLocalStorageChange();
}

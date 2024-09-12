/* base */

export type StorageType = 'localStorage' | 'sessionStorage'

export function updateStorage(type: StorageType, key: string, data: any) {
  try {
    window[type].setItem(key, JSON.stringify(data))
  } catch {
    console.error('Could not set storage data', type, key, data)
  }
}

export function clearStorage(type: StorageType, key: string) {
  window[type].removeItem(key)
}

export function loadStorage(type: StorageType, key: string) {
  try {
    return JSON.parse(window[type].getItem(key) || '{}')
  } catch {
    console.error('Could not load storage data', type, key)
  }
}

/* local storage */

export function loadLocalStorage(key: string) {
  return loadStorage('localStorage', key)
}

export function updateLocalStorage(key: string, data: any) {
  return updateStorage('localStorage', key, data)
}

export function clearLocalStorage(key: string) {
  return clearStorage('localStorage', key)
}

/* session storage */

export function loadSessionStorage(key: string) {
  return loadStorage('sessionStorage', key)
}

export function updateSessionStorage(key: string, data: any) {
  return updateStorage('sessionStorage', key, data)
}

export function clearSessionStorage(key: string) {
  return clearStorage('sessionStorage', key)
}

const ALL = {
  clearLocalStorage,
  clearSessionStorage,
  clearStorage,
  loadLocalStorage,
  loadSessionStorage,
  loadStorage,
  updateLocalStorage,
  updateSessionStorage,
  updateStorage,
}

export default ALL

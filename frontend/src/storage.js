/* base */
export function updateStorage(type, key, data) {
  try {
    window[type].setItem(key, JSON.stringify(data))
  } catch {
    console.error('Could not set storage data', type, key, data)
  }
}

export function clearStorage(type, key) {
  window[type].removeItem(key)
}

export function loadStorage(type, key) {
  try {
    return JSON.parse(window[type].getItem(key))
  } catch {
    console.error('Could not load storage data', type, key)
  }
}

/* local storage */

export function loadLocalStorage(key) {
  return loadStorage('localStorage', key)
}

export function updateLocalStorage(key, data) {
  return updateStorage('localStorage', key, data)
}

export function clearLocalStorage(key) {
  return clearStorage('localStorage', key)
}

/* session storage */

export function loadSessionStorage(key) {
  return loadStorage('sessionStorage', key)
}

export function updateSessionStorage(key, data) {
  return updateStorage('sessionStorage', key, data)
}

export function clearSessionStorage(key) {
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

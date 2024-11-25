export const REMOVE_CACHE_TIMEOUT = 300 // seconds

export const defaultHeaders: { [key: string]: { [key: string]: any } } = {
  common: {
    Accept: 'application/json',
  },
  del: {},
  patch: {
    'Content-Type': 'application/json',
  },
  post: {
    'Content-Type': 'application/json',
  },
  put: {
    'Content-Type': 'application/json',
  },
  get: {},
}

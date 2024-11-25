import { store } from '@ors/_store'
import { addTrailingSlash, removeFirstSlash } from '@ors/helpers/Url/Url'
import config from '@ors/registry'

export function delayExecution(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function formatApiUrl(path: string) {
  // Check if the path is external
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  let adjustedPath,
    apiPath = ''
  const settings = store.current.getState().settings
  const headers = null
  const protocol = (settings?.protocol)?.split(',')[0]
  const host = settings?.host

  if (config.settings.apiPath) {
    apiPath = config.settings.apiPath
  } else {
    apiPath = protocol + '://' + host
  }

  apiPath = addTrailingSlash(apiPath)
  adjustedPath = removeFirstSlash(path)
  adjustedPath =
    adjustedPath !== '/' ? addTrailingSlash(adjustedPath) : adjustedPath

  return `${apiPath}${adjustedPath}`
}

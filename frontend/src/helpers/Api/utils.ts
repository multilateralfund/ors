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
  const settings = __CLIENT__ ? store.current.getState().settings : null
  const headers = __SERVER__ ? require('next/headers').headers() : null
  const protocol = (
    __CLIENT__ ? settings?.protocol : headers?.get('x-next-protocol')
  )?.split(',')[0]
  const host = __CLIENT__ ? settings?.host : headers?.get('x-next-host')

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

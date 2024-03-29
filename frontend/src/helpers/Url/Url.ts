import type {
  Mutable,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
} from '@ors/types/url'

import { warning } from '../Log/Log'

type CompiledPathParam = { isOptional?: boolean; paramName: string }

export function removeTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '')
}

export function removeFirstSlash(path: string): string {
  // Check if the string starts with a slash
  if (path.startsWith('/')) {
    // Remove the first slash
    return path.slice(1)
  }

  // Return the original string if it doesn't start with a slash
  return path
}

export function addTrailingSlash(path: string): string {
  const url = new URL(
    `http://trailingslash:3000${path[0] === '/' ? path : `/${path}`}`,
  )
  // Check if the string already ends with a slash
  if (!url.pathname.endsWith('/')) {
    // Add the trailing slash
    return removeFirstSlash(url.pathname + '/' + url.search + url.hash)
  }

  // Return the original string if it already has a trailing slash
  return path
}

function compilePath(
  path: string,
  caseSensitive = false,
  end = true,
): [RegExp, CompiledPathParam[]] {
  warning(
    path === '*' || !path.endsWith('*') || path.endsWith('/*'),
    `Route path "${path}" will be treated as if it were ` +
      `"${path.replace(/\*$/, '/*')}" because the \`*\` character must ` +
      `always follow a \`/\` in the pattern. To get rid of this warning, ` +
      `please change the route path to "${path.replace(/\*$/, '/*')}".`,
  )

  const params: CompiledPathParam[] = []
  let regexpSource =
    '^' +
    path
      .replace(/\/*\*?$/, '') // Ignore trailing / and /*, we'll handle it below
      .replace(/^\/*/, '/') // Make sure it has a leading /
      .replace(/[\\.*+^${}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace('/\\*\\*', '/.*')
      .replace(/\/:(\w+)(\?)?/g, (_: string, paramName: string, isOptional) => {
        params.push({ isOptional: isOptional != null, paramName })
        return isOptional ? '/?([^\\/]+)?' : '/([^\\/]+)'
      })

  if (path.endsWith('*')) {
    params.push({ paramName: '*' })
    regexpSource +=
      path === '*' || path === '/*'
        ? '(.*)$' // Already matched the initial /, just match the rest
        : '(?:\\/(.+)|\\/*)$' // Don't include the / in params["*"]
  } else if (end) {
    // When matching to the end, ignore trailing slashes
    regexpSource += '\\/*$'
  } else if (path !== '' && path !== '/') {
    // If our path is non-empty and contains anything beyond an initial slash,
    // then we have _some_ form of path in our regex, so we should expect to
    // match only if we find the end of this path segment.  Look for an optional
    // non-captured trailing slash (to match a portion of the URL) or the end
    // of the path (if we've matched to the end).  We used to do this with a
    // word boundary but that gives false positives on routes like
    // /user-preferences since `-` counts as a word boundary.
    regexpSource += '(?:(?=\\/|$))'
  } else {
    // Nothing to match for "" or "/"
  }

  const matcher = new RegExp(regexpSource, caseSensitive ? undefined : 'i')

  return [matcher, params]
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value)
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`,
    )

    return value
  }
}

/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/utils/match-path
 */
export function matchPath<
  ParamKey extends ParamParseKey<Path>,
  Path extends string,
>(
  pattern: Path | PathPattern<Path>,
  pathname: string,
): PathMatch<ParamKey> | null {
  if (typeof pattern === 'string') {
    pattern = { caseSensitive: false, end: true, path: pattern }
  }

  const [matcher, compiledParams] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end,
  )

  const match = pathname.match(matcher)
  if (!match) return null

  const matchedPathname = match[0]
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, '$1')
  const captureGroups = match.slice(1)
  const params: Params = compiledParams.reduce<Mutable<Params>>(
    (memo, { isOptional, paramName }, index) => {
      // We need to compute the pathnameBase here using the raw splat value
      // instead of using params["*"] later because it will be decoded then
      if (paramName === '*') {
        const splatValue = captureGroups[index] || ''
        pathnameBase = matchedPathname
          .slice(0, matchedPathname.length - splatValue.length)
          .replace(/(.)\/+$/, '$1')
      }

      const value = captureGroups[index]
      if (isOptional && !value) {
        memo[paramName] = undefined
      } else {
        memo[paramName] = safelyDecodeURIComponent(value || '', paramName)
      }
      return memo
    },
    {},
  )

  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern,
  }
}

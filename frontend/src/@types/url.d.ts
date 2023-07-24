type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined
}

// Recursive helper for finding path parameters in the absence of wildcards
type _PathParam<Path extends string> =
  // split path into individual path segments
  Path extends `${infer L}/${infer R}`
    ? _PathParam<L> | _PathParam<R>
    : // find params after `:`
    Path extends `:${infer Param}`
    ? Param extends `${infer Optional}?`
      ? Optional
      : Param
    : // otherwise, there aren't any params present
      never

/**
 * Examples:
 * "/a/b/*" -> "*"
 * ":a" -> "a"
 * "/a/:b" -> "b"
 * "/a/blahblahblah:b" -> "b"
 * "/:a/:b" -> "a" | "b"
 * "/:a/b/:c/*" -> "a" | "c" | "*"
 */
type PathParam<Path extends string> =
  // check if path is just a wildcard
  Path extends '*' | '/*'
    ? '*'
    : // look for wildcard at the end of the path
    Path extends `${infer Rest}/*`
    ? '*' | _PathParam<Rest>
    : // look for params in the absence of wildcards
      _PathParam<Path>

// Attempt to parse the given string segment. If it fails, then just return the
// plain string type as a default fallback. Otherwise return the union of the
// parsed string literals that were referenced as dynamic segments in the route.
export type ParamParseKey<Segment extends string> =
  // if could not find path params, fallback to `string`
  [PathParam<Segment>] extends [never] ? string : PathParam<Segment>

/**
 * A PathPattern is used to match on some portion of a URL pathname.
 */
export interface PathPattern<Path extends string = string> {
  /**
   * Should be `true` if the static portions of the `path` should be matched in
   * the same case.
   */
  caseSensitive?: boolean
  /**
   * Should be `true` if this pattern should match the entire URL pathname.
   */
  end?: boolean
  /**
   * A string to match against a URL pathname. May contain `:id`-style segments
   * to indicate placeholders for dynamic parameters. May also end with `/*` to
   * indicate matching the rest of the URL pathname.
   */
  path: Path
}

/**
 * A PathMatch contains info about how a PathPattern matched on a URL pathname.
 */
export interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern
}

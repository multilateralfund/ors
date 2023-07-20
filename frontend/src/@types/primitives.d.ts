export type AnyObject = { [key: string]: any }

export type SliceData = {
  data: AnyObject | null | undefined
  error: AnyObject | null | undefined
  loading: Boolean
  loaded: Boolean
}

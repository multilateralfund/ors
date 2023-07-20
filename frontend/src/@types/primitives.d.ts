export type AnyObject = { [key: string]: any }

export type SliceData = {
  data: AnyObject | Array<any> | null | undefined
  error: AnyObject | Array<any> | null | undefined
  loading: Boolean
  loaded: Boolean
}

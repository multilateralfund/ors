export declare type AnyObject = Record<
  string,
  Array<any> | boolean | number | string | undefined
>

export declare type DataType = AnyObject | Array<any> | null | undefined

export declare type ErrorType = AnyObject | Array<any> | null | undefined

export declare type SliceData = {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
}

export declare type Params = any

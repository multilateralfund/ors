// import { Primitive, UnknownArray, UnknownRecord } from 'type-fest'

// export declare type DataType = Primitive | UnknownArray | UnknownRecord
export declare type DataType = any

// export declare type ErrorType = Primitive | UnknownArray | UnknownRecord
export declare type ErrorType = any

export declare type SliceData<D = DataType, E = ErrorType> = {
  data: D
  error: E
  loaded: boolean
  loading: boolean
}

export declare type Params = any

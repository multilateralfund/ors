import { initialRequestParams } from './initialData.ts'

export type ApiFilters = {
  agency: ApiFilterOption[]
  submission_status: ApiFilterOption[]
}
export type ApiFilterOption = {
  name: string
  id: number
}
export type RequestParams = ReturnType<typeof initialRequestParams>

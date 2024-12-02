import type { IApi, ResultsType } from './types'
import { DataType } from '@ors/types/primitives'

import Cookies from 'js-cookie'

import { formatApiUrl } from '@ors/helpers'

import api from './_api'

export function getResults<D = DataType>(
  data?: { results: D[] } | D[] | ResultsType<D> | null,
): ResultsType<D> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      loaded: true,
      results: data,
    }
  }
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as ResultsType<D>).results)
  ) {
    return {
      ...(data || {}),
      count:
        typeof (data as ResultsType<D>).count === 'number'
          ? (data as ResultsType<D>).count
          : 0,
      loaded: true,
      results: (data as ResultsType<D>).results || [],
    }
  }
  return {
    count: 0,
    loaded: false,
    results: [],
  }
}

export async function fetcher({
  onError = () => {},
  onPending = () => {},
  onSuccess = () => {},
  options,
  path,
  throwError,
}: {
  onError?: (error: any) => void
  onPending?: () => void
  onSuccess?: (data: any) => void
  options?: IApi['options']
  path: IApi['path']
  throwError?: IApi['throwError']
}) {
  if (!throwError) {
    const data = await api(path, options, throwError)
    onSuccess(data || null)
    return data
  }
  onPending()
  try {
    const data = await api(path, options, throwError)
    onSuccess(data)
    return data
  } catch (error) {
    onError(error)
    return error
  }
}

export async function uploadFiles(path: string, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append(file.name, file)
  })

  const csrftoken = Cookies.get('csrftoken')
  const fileUploadResponse = await fetch(formatApiUrl(path), {
    body: formData,
    credentials: 'include',
    headers: {
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    },
    method: 'POST',
  })
  if (!fileUploadResponse.ok) {
    throw fileUploadResponse
  }

  const response = await fileUploadResponse.json()

  return {
    response: response,
    status: fileUploadResponse.status,
  }
}

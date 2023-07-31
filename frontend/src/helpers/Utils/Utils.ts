import { get } from 'lodash'

export function updateObject(
  obj: { [key: string]: any },
  selector: Array<string> | string,
  data: { [key: string]: any },
) {
  let leaf = get(obj, selector, undefined)
  if (!leaf) return undefined
  leaf = { ...leaf, ...data }

  const keys = Array.isArray(selector) ? selector : selector.split('.')
  const result: { [key: string]: any } = {}

  for (const key of keys) {
    result[key] = obj[key]
  }

  // let path = ''

  // for (const key of keys) {
  //   if (result.hasOwnProperty(key)) {
  //     result = result[key]
  //     path += `${key}.`

  //     // If the current result is not an object, stop iterating and return undefined
  //     if (typeof result !== 'object' || result === null) {
  //       return undefined
  //     }
  //   } else {
  //     return undefined // Property not found
  //   }
  // }

  // return { [path.slice(0, -1)]: result }
}

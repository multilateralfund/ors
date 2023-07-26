import { Error } from '@ors/components'

export default function NotFound() {
  return <Error message="Page not found" statusCode={404}></Error>
}

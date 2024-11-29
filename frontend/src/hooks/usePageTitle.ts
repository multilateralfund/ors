import { useEffect } from 'react'

export default function usePageTitle(title: string) {
  useEffect(
    function () {
      document.title = title
      return function () {
        document.title = 'KMS'
      }
    },
    [title],
  )
}

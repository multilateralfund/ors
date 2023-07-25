/* eslint-disable react-hooks/rules-of-hooks */
// @ts-nocheck
// Typescript complains that SSRTrans is an async function.
// This component will only be rendered on SSR and replace in CSR with CSRTrans.
// Don't use it in client components!
import type { Language } from '@ors/types/locales'
import type { AnyObject } from '@ors/types/primitives'

import config from '@ors/config'

import { useTranslation } from '@ors/i18n'

export default async function SSRTrans({
  id,
  children,
  lang,
  ns,
  options,
}: {
  children: React.ReactNode
  id?: string
  lang: Language
  ns?: string
  options?: AnyObject
}) {
  const { i18n, t } = await useTranslation(
    lang,
    ns || config.i18n.defaultNamespace,
  )

  if (id && i18n.exists(`${ns || config.i18n.defaultNamespace}:${id}`)) {
    return t(id, options)
  }

  return children
}

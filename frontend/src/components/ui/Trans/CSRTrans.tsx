import type { AnyObject } from '@ors/types/primitives'

import config from '@ors/registry'

import { useTranslation } from '@ors/i18n/client'

export default function CSRTrans({
  id,
  children,
  ns,
  options,
}: {
  children: React.ReactNode
  id?: string
  ns?: string
  options?: AnyObject
}) {
  const { i18n, t } = useTranslation(ns || config.i18n.defaultNamespace)

  if (id && i18n.exists(`${ns || config.i18n.defaultNamespace}:${id}`)) {
    return t(id, options)
  }

  return children
}

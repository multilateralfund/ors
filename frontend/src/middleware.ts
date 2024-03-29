import type { Language, Locale } from '@ors/types/locales'
import type { NextRequest } from 'next/server'

import { pick } from 'accept-language-parser'
import { NextResponse } from 'next/server'

import appConfig from '@ors/registry'

import { removeTrailingSlash } from './helpers/Url/Url'

const { cookies, i18n, settings } = appConfig
const { defaultLanguage, locales } = i18n

const languageCookie = cookies.language

function getLocale(request: NextRequest, headers: Headers): Locale {
  let language: Language
  const languages = locales.map((locale) => locale.code)
  if (request.cookies.has(languageCookie)) {
    language = pick(
      languages,
      request.cookies.get(languageCookie)?.value || [],
      {
        loose: true,
      },
    ) as Language
  }

  return locales.filter((locale) => {
    return (
      locale.code ===
      (language ||
        pick(languages, headers.get('Accept-Language') ?? [], {
          loose: true,
        }) ||
        defaultLanguage)
    )
  })[0]
}

export default function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const locale = getLocale(request, headers) ?? defaultLanguage
  const pathname = removeTrailingSlash(request.nextUrl.pathname)
  const protocol =
    settings.protocol ||
    headers.get('X-Forwarded-Proto') ||
    request.nextUrl.protocol
  const host =
    settings.host || headers.get('X-Forwarded-Host') || request.nextUrl.host

  headers.set('x-next-pathname', pathname)
  headers.set('x-next-lang', locale.code)
  headers.set('x-next-host', host)
  headers.set('x-next-protocol', protocol)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

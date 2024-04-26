import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import appConfig from '@ors/registry'

import { removeTrailingSlash } from './helpers/Url/Url'

const { settings } = appConfig

export default function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const pathname = removeTrailingSlash(request.nextUrl.pathname)
  const protocol =
    settings.protocol ||
    headers.get('X-Forwarded-Proto') ||
    request.nextUrl.protocol
  const host =
    settings.host || headers.get('X-Forwarded-Host') || request.nextUrl.host

  headers.set('x-next-pathname', pathname)
  headers.set('x-next-host', host)
  headers.set('x-next-protocol', protocol)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

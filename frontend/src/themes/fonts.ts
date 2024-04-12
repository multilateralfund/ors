import { Roboto, Roboto_Condensed } from 'next/font/google'

export const roboto = Roboto({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
})

export const robotoCondensed = Roboto_Condensed({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
})

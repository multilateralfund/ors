import { useTranslation } from 'react-i18next'
import { imgSrc } from '@/utils/assets'

export const Logo = () => {
  const { i18n } = useTranslation()

  const logoUrl = imgSrc(`../assets/logos/logo_${i18n.language}.png`)

  return (
    <span className="items-center block w-60 mb-5">
      <img className="w-auto h-auto" src={logoUrl} alt="logo" />
    </span>
  )
}

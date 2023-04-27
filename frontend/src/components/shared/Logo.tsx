import { imgSrc } from '@/utils/assets'

export const Logo = () => {
  return (
    <a href="#" className="items-center block w-60 mb-5">
      <img
        className="w-auto h-auto"
        src={imgSrc('../assets/logos/logo_en.png')}
        alt="logo"
      />
    </a>
  )
}

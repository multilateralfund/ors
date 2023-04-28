import logoUrl from '../../assets/logos/logo_en.png'

export const Logo = () => {
  return (
    <a href="#" className="items-center block w-60 mb-5">
      <img className="w-auto h-auto" src={logoUrl} alt="logo" />
    </a>
  )
}

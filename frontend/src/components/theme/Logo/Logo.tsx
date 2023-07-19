import Image from '@ors/components/ui/Image'

export default function Logo() {
  return (
    <div className="logo relative mb-5 block w-60 items-center">
      <Image src={`/assets/logos/logo_en.png`} alt="Multilateral Fund" />
    </div>
  )
}

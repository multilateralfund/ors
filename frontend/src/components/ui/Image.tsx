import NextImage from 'next/image'

export default function Logo(props: any) {
  return (
    <div className="image-container">
      <NextImage fill objectFit="contain" {...props} />
    </div>
  )
}

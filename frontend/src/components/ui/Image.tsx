import NextImage, { ImageProps } from 'next/image'

export default function Image(props: ImageProps) {
  return (
    <div className="image-container">
      <NextImage fill {...props} />
    </div>
  )
}

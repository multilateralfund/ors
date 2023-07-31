import type { SkeletonProps } from '@mui/material'

import { Skeleton as MuiSkeleton } from '@mui/material'
import NextImage, { ImageProps } from 'next/image'

export default function Image({
  id,
  Skeleton,
  onError,
  onLoadingComplete,
  useSkeleton,
  ...rest
}: ImageProps & { Skeleton?: SkeletonProps; useSkeleton?: boolean }) {
  const skeletonId = id && `${id}-skeleton`
  const imageId = id && `${id}-image`

  return (
    <div className="image-block">
      {useSkeleton && (
        <MuiSkeleton
          id={skeletonId}
          className="h-full w-full"
          animation="wave"
          style={{ display: !skeletonId ? 'none' : 'block' }}
          {...Skeleton}
        />
      )}
      <div
        id={imageId}
        className="image-container"
        {...(imageId && useSkeleton
          ? {
              style: {
                position: 'absolute',
                visibility: 'hidden',
              },
            }
          : {})}
      >
        <NextImage
          fill
          onError={(e) => {
            if (onError) {
              onError(e)
            }
            if (!useSkeleton) return
            const skeletonEl = skeletonId
              ? document.getElementById(skeletonId)
              : null
            const imageEl = imageId ? document.getElementById(imageId) : null
            if (skeletonEl) {
              skeletonEl.style.display = 'block'
            }
            if (imageEl) {
              imageEl.style.position = 'absolute'
              imageEl.style.visibility = 'hidden'
            }
          }}
          onLoadingComplete={(e) => {
            if (onLoadingComplete) {
              onLoadingComplete(e)
            }
            if (!useSkeleton) return
            const skeletonEl = skeletonId
              ? document.getElementById(skeletonId)
              : null
            const imageEl = imageId ? document.getElementById(imageId) : null
            if (skeletonEl) {
              skeletonEl.style.display = 'none'
            }
            if (imageEl) {
              imageEl.style.position = 'relative'
              imageEl.style.visibility = 'visible'
            }
          }}
          {...rest}
        />
      </div>
    </div>
  )
}

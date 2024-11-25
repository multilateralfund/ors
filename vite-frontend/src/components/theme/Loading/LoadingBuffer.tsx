'use client'
import cx from 'classnames'

import { AiOutlineLoading3Quarters } from 'react-icons/ai'

type LoadingBufferProps = {
  active?: boolean
  className?: string
  text?: React.ReactNode
}

export default function LoadingBuffer(props: LoadingBufferProps) {
  const { active = true, className, text } = props

  return (
    <div
      className={cx(
        'absolute top-0 z-10 flex h-screen w-screen items-center justify-center opacity-0 transition-all',
        {
          collapse: !active,
          'opacity-100': active,
        },
        className,
      )}
    >
      <div className="rounded-lg bg-white px-8 py-4 text-primary">
        <div className="flex items-center justify-center gap-x-2">
          {!!text && <p className="text-xl">{text}</p>}
          <AiOutlineLoading3Quarters className="animate-spin" size={24} />
        </div>
      </div>
    </div>
  )
}

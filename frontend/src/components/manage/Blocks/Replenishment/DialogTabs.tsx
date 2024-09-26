'use client'
import type { PropsWithChildren } from 'react'

import cx from 'classnames'

export interface DialogTabButtonsProps {
  current: number
  onClick: (nr: number) => void
  tabs: string[]
}

export interface DialogTabButtonProps {
  className?: string
  isCurrent: boolean
  label: string
  onClick: () => void
}

export function DialogTabButton(props: DialogTabButtonProps) {
  const { className, isCurrent, label, onClick } = props
  return (
    <div
      className={cx(
        { 'bg-primary text-mlfs-hlYellow': isCurrent },
        'inline-flex h-10 min-w-24 cursor-pointer items-center justify-center border px-2 py-1 text-lg font-bold uppercase leading-10 text-gray-400 no-underline hover:bg-primary hover:text-mlfs-hlYellow',
        className,
      )}
      onClick={onClick}
    >
      {label}
    </div>
  )
}

export function DialogTabButtons(props: DialogTabButtonsProps) {
  const { current, onClick, tabs } = props
  const result = []

  function handleClick(nr: number) {
    return () => onClick(nr)
  }

  for (let i = 0; i < tabs.length; i++) {
    result.push(
      <DialogTabButton
        key={i}
        className={cx({
          'rounded-l-lg border-r border-solid border-primary': i === 0,
          'rounded-r-lg border-l border-solid border-primary':
            i === tabs.length - 1,
        })}
        isCurrent={current == i}
        label={tabs[i]}
        onClick={handleClick(i)}
      />,
    )
  }
  return (
    <div className="my-4 flex justify-center border border-x-0 border-b border-t-0 border-solid border-gray-200 pb-4">
      {result}
    </div>
  )
}

export interface DialogTabContentProps extends PropsWithChildren {
  isCurrent: boolean
}

export function DialogTabContent(props: DialogTabContentProps) {
  const { children, isCurrent } = props
  return <div className={cx({ 'collapse hidden': !isCurrent })}>{children}</div>
}

import { KeyboardEventHandler, useCallback, useEffect, useRef } from 'react'

import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { ConfirmDialogProps } from './types'

import { IoCloseCircle } from 'react-icons/io5'

const ConfirmDialog = function ConfirmDialog(props: ConfirmDialogProps) {
  const { children, onCancel, onSubmit, title } = props
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  function submitHandler() {
    dialogRef.current?.close()
    onSubmit()
  }

  const cancelHandler = useCallback(() => {
    dialogRef.current?.close()
    onCancel()
  }, [onCancel])

  const handleKeyDown: KeyboardEventHandler<HTMLDialogElement> = useCallback(
    (evt) => {
      if (evt.key === 'Escape') {
        evt.preventDefault()
        cancelHandler()
      }
    },
    [cancelHandler],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        cancelHandler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [cancelHandler])

  return (
    <dialog
      className={cx(
        'max-h-2/3 justify-between rounded-xl border-none bg-white p-0 shadow-2xl',
        props.className,
      )}
      ref={dialogRef}
      onKeyDown={handleKeyDown}
    >
      <div className="p-6" ref={contentRef}>
        <div className="mb-6 flex items-center justify-between text-secondary">
          <h3 className="m-0 text-xl">{title}</h3>
          <IoCloseCircle
            className="cursor-pointer transition-all hover:rotate-90"
            size={32}
            onClick={cancelHandler}
          />
        </div>
        {children}
        <footer className="mt-6 flex items-center gap-2 border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
          <SubmitButton onClick={submitHandler}>Yes</SubmitButton>
          <CancelButton onClick={cancelHandler}>Cancel</CancelButton>
        </footer>
      </div>
    </dialog>
  )
}

export default ConfirmDialog

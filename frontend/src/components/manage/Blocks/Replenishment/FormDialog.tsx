import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef } from 'react'

import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { FormDialogProps } from './types'

import { IoCloseCircle } from 'react-icons/io5'

const FormDialog = function FormDialog(props: FormDialogProps) {
  const { children, onCancel, onSubmit, title } = props
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Inert is used to prevent initial focus on the first field of the dialog,
    // apparently it's an accessibility no-no, but it's the simplest way.
    // This is mostly needed for dialogs that have a SearchableSelect initial field.
    dialogRef.current?.setAttribute('inert', 'true')
    dialogRef.current?.showModal()
    dialogRef.current?.removeAttribute('inert')
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  function submitHandler(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault()
    const formData = new FormData(evt.currentTarget)
    dialogRef.current?.close()
    evt.currentTarget.reset()
    onSubmit(formData, evt)
  }

  const cancelHandler = useCallback(() => {
    formRef.current?.reset()
    dialogRef.current?.close()
    onCancel()
  }, [onCancel])

  function handleKeyDown(evt: KeyboardEvent<HTMLDialogElement>) {
    if (evt.key === 'Escape') {
      evt.preventDefault()
      cancelHandler()
    }
  }

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
      <div className="p-8" ref={contentRef}>
        <div className="mb-8 flex items-center justify-between text-secondary">
          <h3 className="m-0 text-xl">{title}</h3>
          <IoCloseCircle
            className="cursor-pointer transition-all hover:rotate-90"
            size={32}
            onClick={cancelHandler}
          />
        </div>
        <form
          encType="multipart/form-data"
          ref={formRef}
          onSubmit={submitHandler}
        >
          {children}
          <footer className="mt-8 flex items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
            <CancelButton onClick={cancelHandler}>Cancel</CancelButton>
            <SubmitButton>Submit</SubmitButton>
          </footer>
        </form>
      </div>
    </dialog>
  )
}

export default FormDialog

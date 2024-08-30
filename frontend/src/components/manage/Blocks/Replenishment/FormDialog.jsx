import { useCallback, useEffect, useRef } from 'react'

import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { IoCloseCircle } from 'react-icons/io5'

/**
 * Display a form in a dialog.
 *
 * @typedef {object} FormDialogProps
 * @property {string} [title]
 * @property {() => void} onCancel
 * @property {(formData: FormData, evt: React.FormEvent<HTMLFormElement>) => void} onSubmit
 *
 * @param {React.PropsWithChildren & FormDialogProps} props
 * @returns {React.ReactElement}
 */
const FormDialog = function FormDialog(props) {
  const { children, onCancel, onSubmit, title } = props
  const dialogRef = useRef(null)
  const contentRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    dialogRef.current.showModal()
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  function submitHandler(evt) {
    evt.preventDefault()
    const formData = new FormData(evt.target)
    dialogRef.current.close()
    evt.target.reset()
    onSubmit(formData, evt)
  }

  const cancelHandler = useCallback(
    (evt) => {
      formRef.current.reset()
      dialogRef.current.close()
      onCancel()
    },
    [onCancel],
  )

  function handleKeyDown(evt) {
    if (evt.key === 'Escape') {
      evt.preventDefault()
      cancelHandler(evt)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
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

import { useEffect, useRef } from 'react'

import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { IoCloseCircle } from 'react-icons/io5'

const ConfirmDialog = function ConfirmDialog(props) {
  const { children, onCancel, onSubmit, title } = props
  const dialogRef = useRef(null)

  useEffect(() => {
    dialogRef.current.showModal()
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  function submitHandler(evt) {
    dialogRef.current.close()
    onSubmit()
  }

  function cancelHandler(evt) {
    dialogRef.current.close()
    onCancel()
  }

  function handleKeyDown(evt) {
    if (evt.key === 'Escape') {
      evt.preventDefault()
      cancelHandler(evt)
    }
  }

  return (
    <dialog
      className={cx(
        'max-h-2/3 justify-between rounded-xl border-none bg-white p-8 shadow-2xl',
        props.className,
      )}
      ref={dialogRef}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-8 flex items-center justify-between text-secondary">
        <h3 className="m-0 text-xl">{title}</h3>
        <IoCloseCircle
          className="cursor-pointer transition-all hover:rotate-90"
          size={32}
          onClick={cancelHandler}
        />
      </div>
      {children}
      <footer className="mt-8 flex items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
        <SubmitButton onClick={submitHandler}>Yes</SubmitButton>
        <CancelButton onClick={cancelHandler}>Cancel</CancelButton>
      </footer>
    </dialog>
  )
}

export default ConfirmDialog
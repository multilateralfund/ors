import { forwardRef, useImperativeHandle, useRef } from 'react'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { IoCloseCircle } from 'react-icons/io5'

const Dialog = forwardRef(function AddInvoiceDialog(props, ref) {
  const { children, onSubmit, title } = props
  const dialogRef = useRef(null)

  useImperativeHandle(
    ref,
    () => {
      return {
        hide() {
          dialogRef.current.close()
        },
        show() {
          dialogRef.current.showModal()
        },
      }
    },
    [],
  )

  function submitHandler(evt) {
    evt.preventDefault()
    const formData = new FormData(evt.target)
    const data = {
      country: evt.target.iso3.querySelector(
        `option[value=${evt.target.iso3.value}]`,
      ).dataset.name,
    }
    for (const [k, v] of formData.entries()) {
      data[k] = v
    }
    dialogRef.current.close()
    evt.target.reset()
    onSubmit(data, evt)
  }

  return (
    <dialog
      className="max-h-2/3 justify-between rounded-xl border-none bg-white p-8 shadow-2xl"
      ref={dialogRef}
    >
      <div className="mb-8 flex items-center justify-between text-secondary">
        <h3 className="m-0 text-xl">{title}</h3>
        <IoCloseCircle
          className="cursor-pointer transition-all hover:rotate-90"
          size={32}
          onClick={() => dialogRef.current.close()}
        />
      </div>
      <form onSubmit={submitHandler}>
        {children}
        <div className="mt-8 flex items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
          <CancelButton onClick={() => dialogRef.current.close()}>
            Cancel
          </CancelButton>
          <SubmitButton>Submit</SubmitButton>
        </div>
      </form>
    </dialog>
  )
})

export default Dialog

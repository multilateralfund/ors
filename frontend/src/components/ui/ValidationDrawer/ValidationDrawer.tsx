import cx from 'classnames'

import { extractErrors } from '@ors/contexts/Validation/utils'
import useClickOutside from '@ors/hooks/useClickOutside'

import { IValidationDrawer } from './types'

import { IoCloseCircle } from 'react-icons/io5'

export default function ValidationDrawer({
  isOpen,
  onClose,
  ...props
}: IValidationDrawer) {
  const errors = extractErrors(props.errors)
  const ref = useClickOutside(() => {
    onClose()
  })
  return (
    <div
      className={cx(
        'fixed left-0 top-0 z-absolute h-full w-4/12 -translate-x-full transform bg-white opacity-0 shadow-2xl duration-500 transition-all',
        { 'translate-x-0 opacity-100': isOpen },
      )}
      ref={ref}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between text-secondary">
          <strong className="text-2xl font-bold">Warnings and errors</strong>
          <IoCloseCircle
            className="cursor-pointer transition-all hover:rotate-90"
            size={32}
            onClick={onClose}
          />
        </div>
      </div>
      <div className="h-full overflow-auto px-6 py-4">
        {errors.map((sectionErrors) => {
          const { errors: errorList, section_id } = sectionErrors
          return (
            <div key={section_id}>
              <h4 className="uppercase">{section_id.replace('_', ' ')}</h4>
              <div className="text-xl ">
                {errorList.map((item: any, index) => {
                  const message = item.row
                    ? `${item.row} - ${item.message}`
                    : item.message
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-x-4 px-4 py-2"
                    >
                      <div className="text-5xl leading-tight">{'\u2022'}</div>
                      <div>{message}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

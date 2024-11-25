import type {
  IGlobalValidationResult,
  IValidationContext,
  ValidateSectionResultValue,
  ValidationSchemaKeys,
} from '@ors/contexts/Validation/types'

import { useContext } from 'react'

import { Button } from '@mui/material'

import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { extractErrors } from '@ors/contexts/Validation/utils'

import { IoCloseCircle } from 'react-icons/io5'

function ErrorItem(props: { item: any }) {
  const item = props.item
  const message = item.row ? `${item.row} - ${item.message}` : item.message
  return (
    <div className="flex items-center gap-x-4 px-4 py-2">
      <div className="text-5xl leading-tight">{'\u2022'}</div>
      <div>{message}</div>
    </div>
  )
}

function SectionErrors(props: {
  errors: IGlobalValidationResult[] | ValidateSectionResultValue[]
  sectionId: ValidationSchemaKeys
}) {
  const rowErrors = props.errors
  const section_id = props.sectionId

  const errors = new Array(rowErrors.length)

  for (let i = 0; i < rowErrors.length; i++) {
    errors[i] = <ErrorItem key={i} item={rowErrors[i]} />
  }

  return (
    <div>
      <h4 className="uppercase">{section_id.replace('_', ' ')}</h4>
      <div className="text-lg">{errors}</div>
    </div>
  )
}

function ShowErrors(props: { errors: IValidationContext['errors'] }) {
  const errors = extractErrors(props.errors)
  const output = new Array(errors.length)

  for (let i = 0; i < errors.length; i++) {
    output[i] = (
      <SectionErrors
        key={errors[i].section_id}
        errors={errors[i].errors}
        sectionId={errors[i].section_id}
      />
    )
  }

  return output
}

const MSG_COMMON =
  'By submitting this form, you acknowledge that substances and blends not reported here are considered to have zero values.'

const MSG_CREATE = [
  'You are trying to submit a country programme report.',
  '\n',
  MSG_COMMON,
]
const MSG_EDIT = [
  'You are trying to submit a new version of a country programme report.',
  '\n',
  MSG_COMMON,
]

const MSG_HAS_ERRORS =
  'Do you confirm the submission, taking into account the warnings/errors listed below?'
const MSG_NO_ERRORS = 'Do you confirm the submission?'

interface IConfirmSubmission {
  mode: 'create' | 'edit'
  onCancel: () => void
  onSubmit: () => void
  validation?: IValidationContext
}

function ConfirmSubmission(props: IConfirmSubmission) {
  const { mode, onCancel, onSubmit } = props

  const contextValidation = useContext(ValidationContext)
  const validation = props.validation ?? contextValidation

  let msg: any = ''

  switch (mode) {
    case 'edit':
      msg = MSG_EDIT
      break
    case 'create':
      msg = MSG_CREATE
      break
  }

  return (
    <>
      <div
        className="fixed left-0 top-0 z-10 flex h-full w-full backdrop-blur-xl"
        onClick={onCancel}
      ></div>
      <div className="max-h-2/3 fixed left-0 top-1/2 z-absolute flex w-1/2 -translate-y-1/2 translate-x-1/2 flex-col justify-between overflow-scroll rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between text-secondary">
          <h4 className="m-0 text-xl">Confirm submission</h4>
          <IoCloseCircle
            className="cursor-pointer transition-all hover:rotate-90"
            size={32}
            onClick={onCancel}
          />
        </div>
        <div className="max-h-[80vh] overflow-auto">
          <p className="whitespace-pre-line text-lg leading-loose">
            {msg}
            {'\n'}
            {validation?.hasErrors ? MSG_HAS_ERRORS : MSG_NO_ERRORS}
          </p>
          <ShowErrors errors={validation?.errors || {}} />
        </div>
        <div className="flex items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
          <Button
            className="btn-close bg-gray-600 px-4 py-2 shadow-none"
            color="secondary"
            size="large"
            variant="contained"
            onClick={onCancel}
          >
            Go back to editing
          </Button>
          <Button
            className="px-4 py-2 shadow-none"
            color="secondary"
            size="large"
            variant="contained"
            onClick={onSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  )
}

export default ConfirmSubmission

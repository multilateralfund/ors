import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionDCreate from '../Create/Create'
import { SectionDEditProps } from './types'

function SectionDEdit(props: SectionDEditProps) {
  const { Comments, form, setForm, showComments, ...rest } = props
  return (
    <>
      <SectionDCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      {showComments ? (
        <Comments form={form} section="section_d" setForm={setForm} />
      ) : null}
    </>
  )
}

export default SectionDEdit

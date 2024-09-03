import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionDCreate from '../Create/Create'
import { ISectionDEditProps } from './types'

function SectionDEdit(props: ISectionDEditProps) {
  const { Comments, form, setForm, ...rest } = props
  return (
    <>
      <SectionDCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      <Comments form={form} section="section_d" setForm={setForm} />
    </>
  )
}

export default SectionDEdit

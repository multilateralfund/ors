import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionACreate from '../Create/Create'
import { ISectionAEditProps } from './types'

function SectionAEdit(props: ISectionAEditProps) {
  const { Comments, form, setForm, ...rest } = props
  return (
    <>
      <SectionACreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      <Comments form={form} section="section_a" setForm={setForm} />
    </>
  )
}

export default SectionAEdit

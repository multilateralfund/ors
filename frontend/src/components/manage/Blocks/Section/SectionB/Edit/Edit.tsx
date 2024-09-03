import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionBCreate from '../Create/Create'
import { ISectionBEditProps } from './types'

function SectionAEdit(props: ISectionBEditProps) {
  const { Comments, form, setForm, ...rest } = props
  return (
    <>
      <SectionBCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      <Comments form={form} section="section_b" setForm={setForm} />
    </>
  )
}

export default SectionAEdit

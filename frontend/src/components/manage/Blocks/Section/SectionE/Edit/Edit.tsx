import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionECreate from '../Create/Create'
import { ISectionEEditProps } from './types'

function SectionEEdit(props: ISectionEEditProps) {
  const { Comments, form, setForm, ...rest } = props
  return (
    <>
      <SectionECreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      <Comments form={form} section="section_e" setForm={setForm} />
    </>
  )
}

export default SectionEEdit

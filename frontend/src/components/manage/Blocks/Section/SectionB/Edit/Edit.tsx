import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionBCreate from '../Create/Create'
import { SectionBEditProps } from './types'

function SectionAEdit(props: SectionBEditProps) {
  const { Comments, form, setForm, showComments, ...rest } = props
  return (
    <>
      <SectionBCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      {showComments ? (
        <Comments form={form} section="section_b" setForm={setForm} />
      ) : null}
    </>
  )
}

export default SectionAEdit

import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionCCreate from '../Create/Create'
import { ISectionCEditProps } from './types'

function SectionCEdit(props: ISectionCEditProps) {
  const { Comments, form, setForm, showComments, ...rest } = props
  return (
    <>
      <SectionCCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      {showComments ? (
        <Comments form={form} section="section_c" setForm={setForm} />
      ) : null}
    </>
  )
}

export default SectionCEdit

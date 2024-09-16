import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../../CountryProgramme/typesCPCreate'
import SectionECreate from '../Create/Create'
import { SectionEEditProps } from './types'

function SectionEEdit(props: SectionEEditProps) {
  const { Comments, form, setForm, showComments, ...rest } = props
  return (
    <>
      <SectionECreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      {showComments ? (
        <Comments form={form} section="section_e" setForm={setForm} />
      ) : null}
    </>
  )
}

export default SectionEEdit

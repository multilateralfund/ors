import { Dispatch, SetStateAction } from 'react'

import { CPBaseForm } from '../../CountryProgramme/typesCPCreate'
import SectionFCreate from './Create'
import { ISectionFEditProps } from './types'

function SectionFEdit(props: ISectionFEditProps) {
  const { Comments, form, setForm, showComments, ...rest } = props
  return (
    <>
      <SectionFCreate
        form={form as unknown as CPBaseForm}
        setForm={setForm as unknown as Dispatch<SetStateAction<CPBaseForm>>}
        {...rest}
      />
      {showComments ? (
        <Comments form={form} section="section_f" setForm={setForm} />
      ) : null}
    </>
  )
}

export default SectionFEdit

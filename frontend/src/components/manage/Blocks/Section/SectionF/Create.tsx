import React from 'react'

import { Box, Typography } from '@mui/material'

import SectionReportedSelect from '@ors/components/manage/Blocks/Section/SectionReportedSelect'
import Field from '@ors/components/manage/Form/Field'

export default function SectionFCreate(props: any) {
  const { form, onSectionCheckChange, section, sectionsChecked, setForm } =
    props

  const sectionName = 'section_f'
  const isSectionChecked = sectionsChecked[sectionName]

  return (
    <>
      <SectionReportedSelect
        isSectionChecked={isSectionChecked}
        sectionName={sectionName}
        onSectionCheckChange={onSectionCheckChange}
      />
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          {section.title}
        </Typography>
        <Field
          FieldProps={{ className: 'mb-0' }}
          type="textarea"
          value={form.section_f.remarks}
          onChange={(event: any) => {
            setForm({ ...form, section_f: { remarks: event.target.value } })
          }}
        />
      </Box>
    </>
  )
}

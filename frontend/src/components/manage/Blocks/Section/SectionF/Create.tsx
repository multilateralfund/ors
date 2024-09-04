import React, { ChangeEvent } from 'react'

import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

import { ISectionFCreateProps } from './types'

export default function SectionFCreate(props: ISectionFCreateProps) {
  const { form, section, setForm } = props

  return (
    <>
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          {section.title}
        </Typography>
        <Field
          FieldProps={{ className: 'mb-0' }}
          type="textarea"
          value={form.section_f.remarks}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setForm({ ...form, section_f: { remarks: event.target.value } })
          }}
        />
      </Box>
    </>
  )
}

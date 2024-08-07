import React from 'react'

import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFCreate(props: any) {
  const { Comments, form, section, setForm, showComments } = props

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
          onChange={(event: any) => {
            setForm({ ...form, section_f: { remarks: event.target.value } })
          }}
        />
      </Box>
      {showComments && <Comments section="section_f" viewOnly={true} />}
    </>
  )
}

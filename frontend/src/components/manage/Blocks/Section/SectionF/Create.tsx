import { useEffect } from 'react'

import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFCreate(props: any) {
  const { form, index, section, setActiveSection, setForm } = props

  useEffect(() => {
    setActiveSection(index)
    /* eslint-disable-next-line  */
  }, [])

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
    </>
  )
}

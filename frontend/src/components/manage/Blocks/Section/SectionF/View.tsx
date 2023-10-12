import { useEffect } from 'react'

import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFView(props: any) {
  const { index, report, section, setActiveSection } = props

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
          readOnly={true}
          type="textarea"
          value={report.section_f.remarks}
        />
      </Box>
    </>
  )
}

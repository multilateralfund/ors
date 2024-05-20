import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFViewDiff(props: any) {
  const { report, section } = props

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
        <Field
          FieldProps={{ className: 'mb-0' }}
          readOnly={true}
          type="textarea"
          value={report.section_f.remarks_old}
        />
      </Box>
    </>
  )
}

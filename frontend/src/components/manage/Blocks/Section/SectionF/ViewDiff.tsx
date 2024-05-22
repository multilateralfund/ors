import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFViewDiff(props: any) {
  const { report, section } = props

  const newRemakrs = report.section_f?.[0].remarks
  const oldRemarks = report.section_f?.[0].remarks_old

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
          value={newRemakrs}
        />
        <Field
          FieldProps={{ className: 'mb-0' }}
          readOnly={true}
          type="textarea"
          value={oldRemarks}
        />

      </Box>
    </>
  )
}

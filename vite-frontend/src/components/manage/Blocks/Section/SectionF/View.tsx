import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import SectionF from '@ors/models/SectionF'

import { SectionFViewProps } from './types'

export default function SectionFView(props: SectionFViewProps) {
  const { Comments, report, section, showComments } = props

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
          value={report.section_f.remarks || ''}
        />
      </Box>
      {showComments && <Comments section="section_f" viewOnly={false} />}
    </>
  )
}

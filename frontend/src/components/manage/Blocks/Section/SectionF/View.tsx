import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

export default function SectionFView(props: { report: Record<string, any> }) {
  const { report } = props

  return (
    <>
      <HeaderTitle>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h3">
            {report.name}
          </Typography>
        )}
      </HeaderTitle>

      <Box>
        <Typography className="mb-4" component="h1" variant="h6">
          SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES
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

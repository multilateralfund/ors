import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import useStore from '@ors/store'
import { SectionF } from '@ors/types'

export default function SectionFEdit() {
  const remarks: SectionF = useStore(
    (state) => state.cp_report_create.section_f.remarks,
  )
  const updateRemarks = useStore(
    (state) => (data: SectionF) =>
      state.cp_report_create.update?.('section_f', data),
  )

  return (
    <>
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES
        </Typography>
        <Field
          type="textarea"
          value={remarks}
          onChange={(event: any) => {
            updateRemarks({ remarks: event.target.value })
          }}
        />
      </Box>
    </>
  )
}

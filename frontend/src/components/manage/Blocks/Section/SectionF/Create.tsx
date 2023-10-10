import { Box, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function SectionFCreate(props: any) {
  const { form, setForm } = props

  return (
    <>
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES
        </Typography>
        <Field
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

import { Box, Typography } from '@mui/material'

export default function SectionFViewDiff(props: any) {
  const { report, section } = props

  if (!report.section_f.length) return null

  const newRemarks = report.section_f?.[0].remarks
  const oldRemarks = report.section_f?.[0].remarks_old

  return (
    <>
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          {section.title}
        </Typography>
        <div className="mb-4">
          <Typography component="h4" variant="h4">
            New Remarks
          </Typography>
          <Typography className="text-lg text-gray-900">
            {newRemarks}
          </Typography>
        </div>
        {oldRemarks && (
          <div className="text-gray-400">
            <Typography component="h4" variant="h4">
              Old Remarks
            </Typography>
            <Typography className="text-lg">{oldRemarks}</Typography>
          </div>
        )}
      </Box>
    </>
  )
}

import { Box, Typography } from '@mui/material'

export default function SectionFViewDiff(props: any) {
  const { report, reportDiff, section } = props

  if (!reportDiff.section_f.length) return null

  const newRemarks = reportDiff.section_f?.[0].remarks
  const oldRemarks = reportDiff.section_f?.[0].remarks_old

  const version = report.data?.version

  return (
    <>
      <Box>
        <Typography className="mb-4" component="h2" variant="h6">
          {section.title}
        </Typography>
        <div className="mb-4">
          <Typography component="h4" variant="h4">
            Version {version} Remarks
          </Typography>
          <Typography className="text-lg text-gray-900">
            {newRemarks}
          </Typography>
        </div>
        <div className="text-gray-400">
          <Typography component="h4" variant="h4">
            Version {version - 1} Remarks
          </Typography>
          <Typography className="text-lg">{oldRemarks || "No content"}</Typography>
        </div>
      </Box>
    </>
  )
}

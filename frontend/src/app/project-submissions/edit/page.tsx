import { Typography } from '@mui/material'

import CreateSubmissionForm from '@ors/components/theme/Forms/CreateSubmissionForm/CreateSubmissionForm'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default async function CreateSubmission() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          New Submission
        </Typography>
      </HeaderTitle>
      <CreateSubmissionForm />
    </PageWrapper>
  )
}

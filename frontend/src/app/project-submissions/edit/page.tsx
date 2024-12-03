import CreateSubmissionForm from '@ors/components/theme/Forms/CreateSubmissionForm/CreateSubmissionForm'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default function CreateSubmission() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>New Submission</PageHeading>
      </HeaderTitle>
      <CreateSubmissionForm />
    </PageWrapper>
  )
}

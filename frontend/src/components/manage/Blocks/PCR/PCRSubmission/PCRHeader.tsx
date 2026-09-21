import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRCreateActionButtons from '../PCRCreate/PCRCreateActionButtons'
import PCREditActionButtons from '../PCREdit/PCREditActionButtons'

import { CircularProgress } from '@mui/material'
import { useLocation } from 'wouter'

const PCRHeader = ({ mode }: { mode: string }) => {
  const [_, setLocation] = useLocation()

  const { pcrMetaproject } = useContext(PCRDataContext)
  const { updatedFields } = useUpdatedFields()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-4">
        <div className="flex flex-col">
          <RedirectBackButton withRedirect={false} onAction={onCancel} />
          <PageHeading>
            {mode === 'edit' ? (
              <>
                <span className="font-medium text-[#4D4D4D]">Update PCR: </span>
                <span>{pcrMetaproject?.data?.umbrella_code}</span>
              </>
            ) : (
              'New PCR submission'
            )}
          </PageHeading>
        </div>
        {isCancelModalOpen && (
          <CancelWarningModal
            mode={`PCR ${mode === 'edit' ? 'updating' : 'creation'}`}
            isModalOpen={isCancelModalOpen}
            setIsModalOpen={setIsCancelModalOpen}
          />
        )}
        <div className="ml-auto mt-auto flex items-center gap-2.5">
          {mode === 'add' ? (
            <PCRCreateActionButtons {...{ setIsLoading }} />
          ) : (
            <PCREditActionButtons {...{ setIsLoading }} />
          )}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
    </HeaderTitle>
  )
}

export default PCRHeader

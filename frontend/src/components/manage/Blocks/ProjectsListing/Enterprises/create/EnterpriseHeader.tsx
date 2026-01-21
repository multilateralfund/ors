import { useState } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import EnterpriseEditActionButtons from '../edit/EnterpriseEditActionButtons'
import EnterpriseCreateActionButtons from './EnterpriseCreateActionButtons'
import { EnterpriseStatus } from '../../ProjectsEnterprises/FormHelperComponents'
import CancelWarningModal from '../../ProjectSubmission/CancelWarningModal'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import {
  EnterpriseHeaderProps,
  EnterpriseOverview,
  EnterpriseType,
} from '../../interfaces'

import { CircularProgress } from '@mui/material'
import { useLocation } from 'wouter'
import cx from 'classnames'

const EnterpriseHeader = ({
  mode,
  enterprise,
  ...rest
}: EnterpriseHeaderProps & {
  mode: string
  enterpriseData: EnterpriseOverview
  enterprise?: EnterpriseType
}) => {
  const [_, setLocation] = useLocation()

  const { updatedFields } = useUpdatedFields()

  const [enterpriseName, setEnterpriseName] = useState(enterprise?.name ?? '')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isEdit = mode === 'edit' && !!enterprise

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton withRedirect={false} onAction={onCancel} />
          <PageHeading>
            {isEdit ? (
              <PageTitle
                pageTitle="Edit enterprise"
                projectTitle={enterpriseName}
              />
            ) : (
              'New enterprise submission'
            )}
          </PageHeading>
          {isEdit && <EnterpriseStatus status={enterprise.status} />}
        </div>
        {isCancelModalOpen && (
          <CancelWarningModal
            mode="enterprise creation"
            isModalOpen={isCancelModalOpen}
            setIsModalOpen={setIsCancelModalOpen}
          />
        )}
        <div
          className={cx('ml-auto flex items-center gap-2.5', {
            'mt-auto': mode === 'add',
          })}
        >
          {mode === 'add' ? (
            <EnterpriseCreateActionButtons {...{ setIsLoading, ...rest }} />
          ) : (
            <EnterpriseEditActionButtons
              {...{ enterprise, setIsLoading, setEnterpriseName, ...rest }}
            />
          )}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
    </HeaderTitle>
  )
}

export default EnterpriseHeader

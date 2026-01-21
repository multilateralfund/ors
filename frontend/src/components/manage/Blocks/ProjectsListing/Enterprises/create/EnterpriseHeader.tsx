import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
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
  const [modalType, setModalType] = useState<string | null>(null)

  const isEdit = mode === 'edit' && !!enterprise

  const onCancel = (mode: string) => {
    setModalType(mode)

    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation(
        `/projects-listing/${mode === 'redirect' ? 'listing' : 'enterprises'}`,
      )
    }
  }

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton
            withRedirect={false}
            onAction={() => onCancel('redirect')}
          />
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
            mode={`enterprise ${isEdit ? 'editing' : 'creation'}`}
            url={
              modalType === 'cancel'
                ? '/projects-listing/enterprises'
                : undefined
            }
            isModalOpen={isCancelModalOpen}
            setIsModalOpen={setIsCancelModalOpen}
          />
        )}
        <div
          className={cx('ml-auto flex items-center gap-2.5', {
            'mt-auto': mode === 'add',
          })}
        >
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <CancelLinkButton
              title="Cancel"
              href={null}
              onClick={() => onCancel('cancel')}
            />
            {mode === 'add' ? (
              <EnterpriseCreateActionButtons {...{ setIsLoading, ...rest }} />
            ) : (
              <EnterpriseEditActionButtons
                {...{ enterprise, setIsLoading, setEnterpriseName, ...rest }}
              />
            )}
          </div>
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
    </HeaderTitle>
  )
}

export default EnterpriseHeader

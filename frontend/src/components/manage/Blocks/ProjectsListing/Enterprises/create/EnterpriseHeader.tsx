import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { EnterpriseStatus } from '../../ProjectsEnterprises/FormHelperComponents'
import EnterpriseEditActionButtons from '../edit/EnterpriseEditActionButtons'
import EnterpriseCreateActionButtons from './EnterpriseCreateActionButtons'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import {
  EnterpriseHeaderProps,
  EnterpriseOverview,
  EnterpriseType,
} from '../../interfaces'

import { CircularProgress } from '@mui/material'
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
  const [enterpriseName, setEnterpriseName] = useState(enterprise?.name ?? '')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton />
          <PageHeading>
            {mode === 'edit' ? (
              <PageTitle
                pageTitle="Edit enterprise"
                projectTitle={enterpriseName}
              />
            ) : (
              'New enterprise submission'
            )}
          </PageHeading>
          {mode === 'edit' && (
            <EnterpriseStatus status={enterprise?.status ?? ''} />
          )}
        </div>
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

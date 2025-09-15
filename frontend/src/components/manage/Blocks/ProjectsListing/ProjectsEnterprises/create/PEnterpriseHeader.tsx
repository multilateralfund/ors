import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PEnterpriseEditActionButtons from '../edit/PEnterpriseEditActionButtons'
import PEnterpriseCreateActionButtons from './PEnterpriseCreateActionButtons'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { EnterpriseStatus } from '../FormHelperComponents'
import {
  PEnterpriseData,
  EnterpriseHeaderProps,
  PEnterpriseType,
} from '../../interfaces'

import { CircularProgress } from '@mui/material'
import cx from 'classnames'

const PEnterpriseHeader = ({
  mode,
  enterprise,
  ...rest
}: EnterpriseHeaderProps & {
  mode: string
  enterpriseData: PEnterpriseData
  enterprise?: PEnterpriseType
}) => {
  const [enterpriseName, setEnterpriseName] = useState(
    enterprise?.enterprise?.name ?? '',
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton />
          <PageHeading>
            {mode === 'edit' ? (
              <PageTitle
                pageTitle="Edit project enterprise"
                projectTitle={enterpriseName}
              />
            ) : (
              'New project enterprise submission'
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
            <PEnterpriseCreateActionButtons {...{ setIsLoading, ...rest }} />
          ) : (
            <PEnterpriseEditActionButtons
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

export default PEnterpriseHeader

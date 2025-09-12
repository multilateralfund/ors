import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PEnterpriseEditActionButtons from '../edit/PEnterpriseEditActionButtons'
import PEnterpriseCreateActionButtons from './PEnterpriseCreateActionButtons'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import {
  EnterpriseData,
  EnterpriseHeaderProps,
  ProjectEnterpriseType,
} from '../../interfaces'

import { CircularProgress } from '@mui/material'

const PEnterpriseHeader = ({
  mode,
  enterprise,
  ...rest
}: EnterpriseHeaderProps & {
  enterpriseData: EnterpriseData
  mode: string
  enterprise?: ProjectEnterpriseType
}) => {
  const [enterpriseTitle, setEnterpriseTitle] = useState(
    enterprise?.enterprise?.name,
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <PageHeading>
              {mode === 'edit' ? (
                <PageTitle
                  pageTitle="Edit project enterprise"
                  projectTitle={enterpriseTitle ?? ''}
                />
              ) : (
                'New project enterprise submission'
              )}
            </PageHeading>
          </div>
        </div>
        <div className="ml-auto mt-auto flex items-center gap-2.5">
          {mode === 'add' ? (
            <PEnterpriseCreateActionButtons {...{ setIsLoading, ...rest }} />
          ) : (
            <PEnterpriseEditActionButtons
              {...{ setIsLoading, setEnterpriseTitle, ...rest }}
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

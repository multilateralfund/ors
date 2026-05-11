import { useContext, useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import EnterpriseCancelButton from './EnterpriseCancelButton'
import { EnterpriseStatus, handleErrors } from '../FormHelperComponents'
import { PageTitle, SubmitButton } from '../../HelperComponents'
import { EnterpriseHeaderProps, EnterpriseType } from '../../interfaces'
import { enabledButtonClassname } from '../../constants'
import { hasSectionErrors } from '../../utils'
import { getFieldErrors } from '../utils'
import { api } from '@ors/helpers'

import { CircularProgress, Button } from '@mui/material'
import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { find } from 'lodash'
import cx from 'classnames'

const EnterpriseHeader = ({
  mode,
  enterprise,
  enterpriseData,
  setEnterpriseId,
  setErrors,
  setOtherErrors,
}: EnterpriseHeaderProps & {
  mode: string
  enterprise?: EnterpriseType
}) => {
  const [_, setLocation] = useLocation()

  const { enterprise_id } = useParams<Record<string, string>>()
  const { statuses } = useContext(EnterprisesDataContext)
  const { clearUpdatedFields } = useUpdatedFields()

  const formatStatus = (enterpriseStatus?: number | null) =>
    find(statuses, (status) => status.id === enterpriseStatus)?.name ?? ''

  const [enterpriseStatus, setEnterpriseStatus] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    setEnterpriseStatus(formatStatus(enterprise?.status))
  }, [statuses])

  const isEdit = mode === 'edit' && !!enterprise

  const overviewErrors = getFieldErrors(enterpriseData.overview, {})
  const isActionDisabled = hasSectionErrors(overviewErrors)

  const onSubmit = async () => {
    setIsLoading(true)
    setErrors({})
    setOtherErrors('')

    try {
      const data = {
        ...enterpriseData.overview,
        ...enterpriseData.details,
        ...enterpriseData.substance_fields,
        ods_odp: enterpriseData.substance_details,
        ...enterpriseData.funding_details,
        ...enterpriseData.remarks,
      }

      const requestUrl = isEdit
        ? `api/enterprises/${enterprise_id}/`
        : 'api/enterprises/'
      const requestMethod = isEdit ? 'PUT' : 'POST'

      const result = await api(requestUrl, {
        data: data,
        method: requestMethod,
      })

      setEnterpriseId(result.id)
      clearUpdatedFields()

      enqueueSnackbar(
        <>Enterprise was {isEdit ? 'updated' : 'created'} successfully.</>,
        {
          variant: 'success',
        },
      )

      if (isEdit) {
        setEnterpriseStatus(formatStatus(result.status))
      } else {
        setLocation(`/projects-listing/enterprises/${result.id}/edit`)
      }
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <EnterpriseCancelButton mode="redirect" {...{ isEdit }} />
          <PageHeading>
            {isEdit ? (
              <PageTitle
                pageTitle="Edit enterprise"
                projectTitle={enterprise.name}
              />
            ) : (
              'New enterprise submission'
            )}
          </PageHeading>
          {isEdit && <EnterpriseStatus status={enterpriseStatus} />}
        </div>
        <div
          className={cx('ml-auto flex items-center gap-2.5', {
            'mt-auto': mode === 'add',
          })}
        >
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <EnterpriseCancelButton mode="cancel" {...{ isEdit }} />
            {mode === 'add' ? (
              <SubmitButton
                title="Create enterprise"
                isDisabled={isActionDisabled}
                onSubmit={onSubmit}
                className="!py-2"
              />
            ) : (
              <Button
                className={cx('px-4 py-2 shadow-none', {
                  [enabledButtonClassname]: !isActionDisabled,
                })}
                onClick={onSubmit}
                disabled={isActionDisabled}
                variant="contained"
                size="large"
              >
                Update enterprise
              </Button>
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

import { useContext } from 'react'

import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { detailsDateFields, enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { PEnterpriseType } from '../../interfaces'
import { getEntityById } from '../utils'

import { map } from 'lodash'

const PEnterpriseDetailsSection = ({
  enterprise,
}: {
  enterprise: PEnterpriseType
}) => {
  const { agencies, project_types } = useContext(ProjectsDataContext)

  const agency = getEntityById(agencies, enterprise.agency)?.name
  const project_type = getEntityById(
    project_types,
    enterprise.project_type,
  )?.name

  return (
    <div className="flex flex-col gap-4">
      <div className={viewColumnsClassName}>
        {detailItem(enterpriseFieldsMapping.agency, agency)}
        {detailItem(enterpriseFieldsMapping.project_type, project_type)}
      </div>
      <div className={viewColumnsClassName}>
        {map(detailsDateFields.slice(0, 2), (field) =>
          dateDetailItem(
            enterpriseFieldsMapping[field],
            enterprise[field as keyof typeof enterprise] as string,
          ),
        )}
        {numberDetailItem(
          enterpriseFieldsMapping.project_duration,
          enterprise.project_duration as string,
          'integer',
        )}
      </div>
      <div className={viewColumnsClassName}>
        {detailItem(
          enterpriseFieldsMapping.meeting,
          getMeetingNr(enterprise?.meeting ?? undefined)?.toString() as string,
        )}
        {map(detailsDateFields.slice(2), (field) =>
          dateDetailItem(
            enterpriseFieldsMapping[field],
            enterprise[field as keyof typeof enterprise] as string,
          ),
        )}
      </div>
      <div className="max-w-[90%]">
        {detailItem(
          enterpriseFieldsMapping.excom_provision,
          enterprise.excom_provision,
          {
            detailClassname: 'self-start',
          },
        )}
      </div>
    </div>
  )
}

export default PEnterpriseDetailsSection

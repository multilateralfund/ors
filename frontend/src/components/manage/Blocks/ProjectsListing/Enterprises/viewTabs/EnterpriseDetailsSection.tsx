import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import {
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { detailsDateFields, enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../../interfaces'

import { map } from 'lodash'

const EnterpriseDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => (
  <div className="flex flex-col gap-4">
    <div className={viewColumnsClassName}>
      {numberDetailItem(
        enterpriseFieldsMapping.local_ownership,
        enterprise.local_ownership as string,
        'decimal',
      )}
      {numberDetailItem(
        enterpriseFieldsMapping.export_to_non_a5,
        enterprise.export_to_non_a5 as string,
        'decimal',
      )}
    </div>
    {detailItem(enterpriseFieldsMapping.application, enterprise.application)}
    <div className={viewColumnsClassName}>
      {detailItem(enterpriseFieldsMapping.stage, enterprise.stage)}
      {numberDetailItem(
        enterpriseFieldsMapping.revision_number,
        enterprise.revision_number as string,
        'integer',
      )}
      {dateDetailItem(
        enterpriseFieldsMapping.date_of_revision,
        enterprise.date_of_revision as string,
      )}
    </div>
    <div className={viewColumnsClassName}>
      {map(detailsDateFields.slice(0, 2), (field, index) => (
        <div key={index}>
          {dateDetailItem(
            enterpriseFieldsMapping[field],
            enterprise[field as keyof typeof enterprise] as string,
          )}
        </div>
      ))}
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
      {map(detailsDateFields.slice(2), (field, index) => (
        <div key={index}>
          {dateDetailItem(
            enterpriseFieldsMapping[field],
            enterprise[field as keyof typeof enterprise] as string,
          )}
        </div>
      ))}
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

export default EnterpriseDetailsSection

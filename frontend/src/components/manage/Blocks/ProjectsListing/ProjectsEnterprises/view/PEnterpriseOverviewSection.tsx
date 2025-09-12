import {
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { EnterpriseOverview } from '../../interfaces'
import { tableColumns } from '../../constants'
import { useStore } from '@ors/store'

import { find, toLower, map } from 'lodash'

const PEnterpriseOverviewSection = ({
  type,
  enterprise,
}: {
  type: string
  enterprise: EnterpriseOverview
}) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.countries.data

  const getAgencyName = (id: number) =>
    find(agencies, (agency) => agency.id === id)?.name

  const country = find(
    countries,
    (country) => country.id === enterprise.country,
  )?.name
  const crtAgencies =
    enterprise.agencies.length > 0
      ? map(enterprise.agencies, (agencyId) => getAgencyName(agencyId)).join(
          ', ',
        )
      : '-'

  const formatFieldName = (fieldName: string) =>
    type === 'enterprise' ? fieldName : 'Enterprise ' + toLower(fieldName)

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {detailItem(formatFieldName(tableColumns.name), enterprise.name)}
        {detailItem(formatFieldName('Agency(ies)'), crtAgencies)}
        {detailItem(formatFieldName(tableColumns.country), country ?? '')}
        {detailItem(
          formatFieldName(tableColumns.location),
          enterprise.location,
        )}
        {detailItem(
          formatFieldName(tableColumns.application),
          enterprise.application,
        )}
      </div>
      <div className="mt-4 flex w-full flex-col gap-4">
        <div className="flex flex-wrap gap-x-7 gap-y-5">
          {numberDetailItem(
            tableColumns.local_ownership + ' (%)',
            enterprise.local_ownership as string,
          )}
          {numberDetailItem(
            tableColumns.export_to_non_a5 + ' (%)',
            enterprise.export_to_non_a5 as string,
          )}
        </div>
      </div>
      <div className="mt-10 max-w-[90%]">
        {detailItem(tableColumns.remarks, enterprise.remarks, 'self-start')}
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection

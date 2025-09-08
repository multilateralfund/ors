import {
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { EnterpriseOverview } from '../../interfaces'
import { tableColumns } from '../../constants'
import { useStore } from '@ors/store'

import { find } from 'lodash'

const PEnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseOverview
}) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const country = find(
    countries,
    (country) => country.id === enterprise.country,
  )?.name

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {detailItem(tableColumns.name, enterprise.name)}
        {detailItem(tableColumns.country, country ?? '')}
        {detailItem(tableColumns.location, enterprise.location)}
        {detailItem(tableColumns.application, enterprise.application)}
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
    </>
  )
}

export default PEnterpriseOverviewSection

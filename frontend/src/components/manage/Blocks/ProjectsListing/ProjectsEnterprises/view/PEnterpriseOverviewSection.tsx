import {
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { EnterpriseType } from '../../interfaces'
import { tableColumns } from '../../constants'
import { useStore } from '@ors/store'

import { find } from 'lodash'

const PEnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const { enterprise: enterpriseObj } = enterprise

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const country = find(
    countries,
    (country) => country.id === enterpriseObj.country,
  )?.name

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {detailItem(tableColumns.name, enterpriseObj.name)}
        {detailItem(tableColumns.country, country ?? '')}
        {detailItem(tableColumns.location, enterpriseObj.location)}
        {detailItem(tableColumns.application, enterpriseObj.application)}
      </div>

      <div className="mt-4 flex w-full flex-col gap-4">
        <div className="flex flex-wrap gap-x-7 gap-y-5">
          {numberDetailItem(
            tableColumns.local_ownership + ' (%)',
            enterpriseObj.local_ownership as string,
          )}
          {numberDetailItem(
            tableColumns.export_to_non_a5 + ' (%)',
            enterpriseObj.export_to_non_a5 as string,
          )}
        </div>
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection

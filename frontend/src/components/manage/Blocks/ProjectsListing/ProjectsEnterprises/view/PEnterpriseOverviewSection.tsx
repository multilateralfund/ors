import {
  detailItem,
  numberDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { EnterpriseType } from '../../interfaces'
import { tableColumns } from '../../constants'

const PEnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {detailItem(tableColumns.enterprise, enterprise.enterprise)}
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

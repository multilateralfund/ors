import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { EnterpriseRemarks } from '../../interfaces'
import { tableColumns } from '../../constants'

const PEnterpriseRemarksSection = ({
  enterprise,
}: {
  enterprise: EnterpriseRemarks
}) => (
  <div className="max-w-[90%]">
    {detailItem(tableColumns.remarks, enterprise.remarks, 'self-start')}
  </div>
)

export default PEnterpriseRemarksSection

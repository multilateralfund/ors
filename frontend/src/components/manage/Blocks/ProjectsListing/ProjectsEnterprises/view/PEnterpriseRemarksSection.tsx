import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { EnterpriseType } from '../../interfaces'
import { tableColumns } from '../../constants'

const PEnterpriseRemarksSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => (
  <div className="max-w-[90%]">
    {detailItem(tableColumns.remarks, enterprise.enterprise.remarks, {
      detailClassname: 'self-start',
    })}
  </div>
)

export default PEnterpriseRemarksSection

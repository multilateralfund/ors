'use client'

import PEnterpriseOverviewSection from '../../ProjectsEnterprises/view/PEnterpriseOverviewSection'
import { EnterpriseEntityType } from '../../interfaces'

const EnterpriseView = ({
  enterprise,
}: {
  enterprise: EnterpriseEntityType
}) => (
  <div className="relative flex flex-col rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
    <PEnterpriseOverviewSection type="enterprise" {...{ enterprise }} />
  </div>
)

export default EnterpriseView

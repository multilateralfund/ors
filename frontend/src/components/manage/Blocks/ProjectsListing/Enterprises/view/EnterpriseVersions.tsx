import VersionsTable from './VersionsTable'
import { EnterpriseEntityType } from '../../interfaces'

const EnterpriseVersions = ({
  enterprise,
}: {
  enterprise: EnterpriseEntityType
}) => {
  const {
    status,
    approved_enterprise,
    pending_enterprises,
    project_enterprises,
  } = enterprise
  const isEnterpriseApproved = status === 'Approved'
  // const versionsData = isEnterpriseApproved
  //   ? pending_enterprises
  //   : approved_enterprise
  //     ? [approved_enterprise]
  //     : []

  return <VersionsTable versions={[]} />
}

export default EnterpriseVersions

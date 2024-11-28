import { useParams } from 'wouter'

import BPList from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPList'

// export const metadata: Metadata = {
//   title: 'Business Plans',
// }

export default function BusinessPlansList() {
  const { period } = useParams<Record<string, string>>()
  return <BPList period={period} />
}

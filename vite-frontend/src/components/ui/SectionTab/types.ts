import { TabProps } from '@mui/material/Tab/Tab'

import { SectionMeta } from '@ors/components/manage/Blocks/CountryProgramme/types'

export interface ISectionTab extends TabProps {
  errors: Record<string, any>
  isActive: boolean
  section: SectionMeta
}

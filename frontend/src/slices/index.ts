import { createBusinessPlanSlice } from '@ors/slices/createBusinessPlanSlice'
import { createCPCurrentTabSlice } from '@ors/slices/createCPCurrentTabSlice'
import { createCPReportsSlice } from '@ors/slices/createCPReportsSlice'
import { createCacheSlice } from '@ors/slices/createCacheSlice'
import { createCommonSlice } from '@ors/slices/createCommonSlice'
import { createHeaderSlice } from '@ors/slices/createHeaderSlice'
import { createI18nSlice } from '@ors/slices/createI18nSlice'
import { createProjectSlice } from '@ors/slices/createProjectSlice'
import { createSettingsSlice } from '@ors/slices/createSettingsSlice'
import { createThemeSlice } from '@ors/slices/createThemeSlice'
import { createUserSlice } from '@ors/slices/createUserSlice'
import { CreateSliceProps } from '@ors/store'

export default function createSlices(props: CreateSliceProps) {
  return {
    businessPlans: { ...createBusinessPlanSlice(props) },
    cache: { ...createCacheSlice(props) },
    common: { ...createCommonSlice(props) },
    // @ts-ignore
    connection: (__CLIENT__ && navigator?.connection?.effectiveType) || null,
    cp_current_tab: { ...createCPCurrentTabSlice(props) },
    cp_reports: { ...createCPReportsSlice(props) },
    header: { ...createHeaderSlice(props) },
    i18n: { ...createI18nSlice(props) },
    internalError: props.initialState.internalError || null,
    projects: { ...createProjectSlice(props) },
    settings: { ...createSettingsSlice(props) },
    theme: { ...createThemeSlice(props) },
    user: { ...createUserSlice(props) },
  }
}

import useApi from '@ors/hooks/useApi'
import {
  ApiProjectSettings,
  ApiProjectSettingsForFrontend,
} from '@ors/types/api_project_settings.ts'

export function useGetProjectSettings(forFrontend: boolean = false) {
  const url = forFrontend
    ? 'api/project-settings?for_frontend=true'
    : 'api/project-settings'
  return useApi<ApiProjectSettingsForFrontend, ApiProjectSettings>({
    options: {
      withStoreCache: false,
    },
    path: url,
  })
}

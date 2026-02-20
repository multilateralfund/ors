import { Dispatch, SetStateAction } from 'react'

import { defaultTrancheErrors } from '../constants'
import {
  ProjectSpecificFields,
  RelatedProjectsType,
  TrancheErrorType,
} from '../interfaces'

import { find, replace } from 'lodash'

export function useGetTrancheErrors(
  result: RelatedProjectsType[],
  projectFields: ProjectSpecificFields[],
  setTrancheErrors: Dispatch<SetStateAction<TrancheErrorType>>,
) {
  if (result.length === 0) {
    setTrancheErrors({
      ...defaultTrancheErrors,
      errorText:
        'A new tranche cannot be created as no previous tranche exists or you are not the lead agency of the MYA.',
      isError: true,
      loaded: true,
    })

    return true
  } else {
    const tranches = result.map((entry) => {
      const filteredWarnings = entry.warnings.filter((warning) => {
        const crtField = find(
          projectFields,
          (field) =>
            field.write_field_name ===
            replace(warning.field, /_?actual_?/g, ''),
        )

        return crtField && crtField.data_type !== 'boolean'
      })

      return {
        ...entry,
        title: entry.title,
        id: entry.id,
        tranche: entry.tranche,
        errors: entry.errors,
        warnings: filteredWarnings,
      }
    })
    const trancheError = tranches.find((tranche) => tranche.errors.length > 0)

    setTrancheErrors({
      ...defaultTrancheErrors,
      errorText: trancheError ? trancheError.errors[0].message : '',
      tranchesData: tranches,
      loaded: true,
    })

    return !!trancheError && !!trancheError.errors[0].message
  }
}

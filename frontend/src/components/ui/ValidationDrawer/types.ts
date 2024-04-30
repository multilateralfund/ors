import type {
  ValidateSectionResult,
  ValidationSchemaKeys,
} from '@ors/contexts/Validation/types'

export interface IValidationDrawer {
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
  isOpen: boolean
  onClose: () => void
}

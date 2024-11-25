import type {
  ValidateSectionResult,
  ValidationSchemaKeys,
} from '@ors/contexts/Validation/types'

export interface IValidationDrawer {
  activeSection?: string
  errors: Record<ValidationSchemaKeys, ValidateSectionResult>
  isOpen: boolean
  onClose: () => void
}

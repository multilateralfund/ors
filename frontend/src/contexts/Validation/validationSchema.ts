import type { ValidationSchema } from './types'

import {
  validateAnnexENonQPS,
  validateBannedImports,
  validateFacilityName,
  validateOtherUnidentifiedManufacturing,
  validateTotals,
  validateUncommonSubstance,
} from './validators'
import { validateAnnexEQPS } from './validators'

const validationSchema: ValidationSchema = {
  section_a: {
    rows: [
      {
        id: 'validate-totals',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'Total "Use by Sector" should be equal to Import-Export+Production. Otherwise, explanation is required for all substances in the "Remarks" column',
        validator: validateTotals,
      },
      {
        id: 'validate-annex-e-qps',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
          remarks: (row) => !row.remarks,
        },
        message:
          'The sum of these 2 fields ("QPS" + "Non-QPS") should be equal to "import". Otherwise, they should fill in the Remarks field.',
        validator: validateAnnexEQPS,
      },
      {
        id: 'validate-annex-e-non-qps',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
          remarks: (row) => !row.remarks,
        },
        message:
          'If Non-QPS is filled in, users must put a date and fill in the Remarks field',
        validator: validateAnnexENonQPS,
      },
      {
        id: 'validate-banned-imports',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
        },
        message:
          'In the case where imports of a specific controlled substance are banned, the date of the ban should be provided',
        validator: validateBannedImports,
      },
    ],
  },
  section_b: {
    rows: [
      {
        id: 'validate-totals',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'Total "Use by Sector" should be equal to Import-Export+Production. Otherwise, explanation is required for all substances in the "Remarks" column',
        validator: validateTotals,
      },
      {
        id: 'validate-other-unidentified-manufacturing',
        highlight_cells: {},
        message:
          'For "Other unidentified manufacturing" – Data should be provided only if break-down of consumption in refrigeration and air-conditioning manufacturing is not available.',
        validator: validateOtherUnidentifiedManufacturing,
      },
      {
        id: 'validate-uncommon-substance',
        highlight_cells: {},
        message:
          'When reporting HFC-41, HFC-134, HFC-143 or HFC-152 - These substances are not commonly used; please check the substance is used while reporting.',
        validator: validateUncommonSubstance,
      },
    ],
  },
  section_e: {
    rows: [
      {
        id: 'validate-facility-name',
        highlight_cells: { facility: () => true },
        message:
          'Facility name must be provided if data in Section D is provided.',
        validator: validateFacilityName,
      },
    ],
  },
}

export default validationSchema

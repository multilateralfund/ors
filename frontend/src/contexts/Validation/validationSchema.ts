import type { ValidationSchema } from './types'

import {
  checkShouldValidateSectionARow,
  checkShouldValidateSectionBRow,
  validateAnnexENonQPSDate,
  validateAnnexENonQPSRemarks,
  validateBannedImportsDate,
  validateBannedImportsRemarks,
  validateBlendComponents,
  validateExportImport,
  validateFacilityName,
  validateHFC23,
  validateOtherUnidentifiedManufacturing,
  validatePrices,
  validatePricesType,
  validateSectionBOther,
  // validateSectionDFilled,
  validateSectionDTotals,
  validateUncommonSubstance,
  validateUsageTotals,
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
        validator: validateUsageTotals,
      },
      {
        id: 'validate-annex-e-qps',
        highlight_cells: {
          remarks: (row) => !row.remarks,
        },
        message:
          'The sum of “QPS” and “Non-QPS” should also be reported under the “Import/Export/Production” columns. Otherwise, explanations should be provided in the Remarks field',
        validator: validateAnnexEQPS,
      },
      {
        id: 'validate-annex-e-non-qps-remarks',
        highlight_cells: {
          remarks: (row) => !row.remarks,
        },
        message:
          'If Non-QPS is provided; explanations should be provided in the Remarks field (i.e, for critical uses approved by the Parties with decision number).',
        validator: validateAnnexENonQPSRemarks,
      },
      {
        id: 'validate-annex-e-non-qps-date',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
        },
        message: 'The date of the ban on Non-QPS should be provided.',
        validator: validateAnnexENonQPSDate,
      },
      {
        id: 'validate-banned-imports-remarks',
        highlight_cells: {
          remarks: (row) => !row.remarks,
        },
        message:
          'This substance has already been banned, if data is provided, explanations should be provided in the “Remarks” field (i.e, recovery/recycling, stockpiles or some special use exemption, etc).',
        validator: validateBannedImportsRemarks,
      },
      {
        id: 'validate-banned-imports-date',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
        },
        message: 'The date of the ban should be provided.',
        validator: validateBannedImportsDate,
      },
      {
        id: 'validate-export-import',
        highlight_cells: {
          remarks: (row) => !row.remarks,
        },
        message:
          'When export is greater than import, explanation should be provided in the “Remarks” column.',
        validator: validateExportImport,
      },
    ],
    shouldValidateRow: checkShouldValidateSectionARow,
  },
  section_b: {
    rows: [
      {
        id: 'validate-totals',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'Total "Use by Sector" should be equal to Import-Export+Production. Otherwise, explanation is required for all substances in the "Remarks" column',
        validator: validateUsageTotals,
      },
      {
        id: 'validate-other-unidentified-manufacturing',
        highlight_cells: {},
        message:
          'For "Other unidentified manufacturing" – Data should be provided only if break-down of consumption in refrigeration and air-conditioning manufacturing is not available.',
        validator: validateOtherUnidentifiedManufacturing,
      },
      {
        id: 'validate-section-b-other',
        highlight_cells: {},
        message:
          'For "Other" – Only apply for uses in other sectors that do not fall specifically within the listed sectors in the table. The sector should be provided in the "Remarks" column',
        validator: validateSectionBOther,
      },
      {
        id: 'validate-uncommon-substance',
        highlight_cells: {},
        message:
          'When reporting HFC-41, HFC-134, HFC-143 or HFC-152 - These substances are not commonly used; please check the substance is used while reporting.',
        validator: validateUncommonSubstance,
      },
      {
        id: 'validate-blend-components',
        highlight_cells: {},
        message:
          'When reporting HFC/HCFC blends, HCFC components should be reported under Section A.',
        validator: validateBlendComponents,
      },
      {
        id: 'validate-hfc23',
        highlight_cells: {},
        message:
          'For HFC-23 (use) - Data should be provided only for use and supply (i.e., import, production and export).',
        validator: validateHFC23,
      },
      {
        id: 'validate-export-import',
        highlight_cells: {
          remarks: (row) => !row.remarks,
        },
        message:
          'When export is greater than import, explanation should be provided in the “Remarks” column.',
        validator: validateExportImport,
      },
    ],
    shouldValidateRow: checkShouldValidateSectionBRow,
  },
  section_c: {
    rows: [
      {
        id: 'validate-prices-type',
        highlight_cells: {},
        message: 'Indicate whether the prices are FOB or retail prices.',
        validator: validatePricesType,
      },
      {
        id: 'validate-prices',
        highlight_cells: {},
        message:
          'Price should be provided, otherwise, the substance should be removed.',
        validator: validatePrices,
      },
    ],
  },
  section_d: {
    rows: [
      // {
      //   id: 'validate-section-d-filled',
      //   highlight_cells: {},
      //   message:
      //     'This form should be filled only if the country generated HFC-23 from any facility that produced (manufactured) HCFC (Annex C - Group I) or HFC (Annex F) substances.',
      //   validator: validateSectionDFilled,
      // },
    ],
  },
  section_e: {
    global: [
      {
        id: 'validate-facility-name',
        highlight: ['+ Add facility'],
        message:
          'Facility name must be provided if data in Section D is provided.',
        validator: validateFacilityName,
      },
    ],
    rows: [
      {
        id: 'validate-section-d-totals',
        highlight_cells: {},
        message:
          'Total for columns under "Amount generated and captured" in Section E should be reported in Section D under the respective column.',
        validator: validateSectionDTotals,
      },
    ],
  },
}

export default validationSchema

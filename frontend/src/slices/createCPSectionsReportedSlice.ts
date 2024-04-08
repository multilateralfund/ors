import type { CPSectionsReportedSlice } from '@ors/types/store'

import { produce } from 'immer'

import { CreateSliceProps } from '@ors/store'

export const createCPSectionsReportedSlice = ({
  set,
}: CreateSliceProps): CPSectionsReportedSlice => ({
  section_a: false,
  section_b: false,
  section_c: false,
  section_d: false,
  section_e: false,
  section_f: false,
  setSectionChecked: (section: string, isChecked: boolean) =>
    set(
      produce((state) => {
        state.cp_sections_reported[section] = isChecked
      }),
    ),
})

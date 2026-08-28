import { describe, expect, it } from 'vitest'

import { buildPCRProjectPayload } from './utils'

describe('buildPCRProjectPayload', () => {
  it('builds the payload accepted by the PCR update endpoint', () => {
    const payload = buildPCRProjectPayload({
      project_id: 101,
      funds_disbursed: '9876.54',
      planned_date_of_completion: '2026-08-31',
      alternative_technologies: [
        {
          substance_from: 10,
          substance_to: 20,
        },
      ],
      enterprises: [
        {
          name: 'Updated enterprise',
          address: 'Updated address',
        },
      ],
      equipments: [
        {
          name: 'Updated equipment',
          description: 'Disposed',
          disposal_type: 2,
          disposal_date: '2026-09-30',
        },
      ],
    })

    expect(payload).toEqual({
      project_id: 101,
      funds_disbursed: '9876.54',
      planned_date_of_completion: '2026-08-31',
      alternative_technologies: [
        {
          substance_from: 10,
          substance_to: 20,
        },
      ],
      enterprises: [
        {
          name: 'Updated enterprise',
          address: 'Updated address',
        },
      ],
      equipments: [
        {
          name: 'Updated equipment',
          description: 'Disposed',
          disposal_type: 2,
          disposal_date: '2026-09-30',
        },
      ],
    })
  })
})

import React, { useMemo } from 'react'

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import { groupBy, map } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

export default function AdmD(props: {
  emptyForm: Record<string, any>
  report: Record<string, Array<any>>
  variant: any
}) {
  const { emptyForm, report } = props

  const rowData = useMemo(() => {
    const dataByRowId = groupBy(report.adm_d, 'row_id')

    return map(emptyForm.admD?.rows, (row) => ({
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
      values: groupBy(dataByRowId[row.id], 'value_choice_id'),
    }))
  }, [emptyForm, report])

  return (
    <>
      <HeaderTitle>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h3">
            {report.name}
          </Typography>
        )}
      </HeaderTitle>
      <Box>
        <Typography component="h2" variant="h6">
          D. Qualitative assessment of the operation of HPMP
        </Typography>
        <List>
          {rowData.map((row, index) => (
            <ListItem key={row.id} className="flex-col items-start pl-0">
              <Typography className="text-lg">
                <span className="mr-2 inline-block">{index + 1}.</span>
                {row.text}
              </Typography>
              <FormGroup className="ml-10">
                {row.choices.map((choice: any) => (
                  <FormControlLabel
                    key={choice.id}
                    label={choice.value}
                    control={
                      <Checkbox
                        checked={!!row.values[choice.id]}
                        disableRipple
                      />
                    }
                  />
                ))}
                {!!row.values['null'] && (
                  <Typography className="mt-2">
                    {row.values['null'][0]?.value_text}
                  </Typography>
                )}
              </FormGroup>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

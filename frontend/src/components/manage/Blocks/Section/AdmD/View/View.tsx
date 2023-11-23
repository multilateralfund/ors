import React, { useEffect, useMemo } from 'react'

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

export default function AdmD(props: any) {
  const { emptyForm, index, report, section, setActiveSection } = props
  const { rows = [] } = emptyForm.adm_d || {}

  const rowData = useMemo(() => {
    const dataByRowId = groupBy(report.adm_d, 'row_id')

    return map(rows, (row) => ({
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
      values: groupBy(
        dataByRowId[row.id],
        (item) => item.values[0]?.value_choice_id,
      ),
    }))
  }, [rows, report])

  useEffect(() => {
    setActiveSection(index)
    /* eslint-disable-next-line  */
  }, [])

  return (
    <>
      <Box>
        <Typography component="h2" variant="h6">
          {section.title}
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

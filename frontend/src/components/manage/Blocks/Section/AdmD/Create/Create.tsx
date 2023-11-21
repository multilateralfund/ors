import React, { useEffect } from 'react'

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import { produce } from 'immer'

export default function AdmD(props: any) {
  const { emptyForm, form, index, section, setActiveSection, setForm } = props
  const { rows = [] } = emptyForm.adm_d || {}

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
          {rows.map((row: any, index: number) => (
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
                        checked={
                          form.adm_d[row.id]?.value_choice_id === choice.id
                        }
                        onChange={(event) => {
                          const checked = event.target.checked
                          setForm(
                            produce((form: any) => {
                              if (!checked) {
                                return
                              }
                              if (form.adm_d[row.id]) {
                                form.adm_d[row.id] = {}
                              }
                              form.adm_d[row.id].value_choice_id = choice.id
                            }),
                          )
                        }}
                      />
                    }
                  />
                ))}
                {/* {!!row.values['null'] && (
                  <Typography className="mt-2">
                    {row.values['null'][0]?.value_text}
                  </Typography>
                )} */}
              </FormGroup>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

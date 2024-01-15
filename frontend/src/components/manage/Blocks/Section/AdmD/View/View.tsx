import React from 'react'

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  Typography,
} from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export default function AdmD(props: any) {
  const { emptyForm, report, section } = props
  const { rows = [] } = emptyForm.adm_d || {}

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
              <FormGroup className="w-full pl-10">
                {row.choices.map((choice: any) => (
                  <React.Fragment key={choice.id}>
                    <FormControlLabel
                      label={choice.value}
                      control={
                        <Checkbox
                          checked={
                            report.adm_d[row.id].value_choice_id === choice.id
                          }
                          disableRipple
                        />
                      }
                    />
                    {choice.with_text && report.adm_d[row.id].value_text && (
                      <Field
                        type="textarea"
                        value={report.adm_d[row.id].value_text}
                        readOnly
                      />
                    )}
                  </React.Fragment>
                ))}
              </FormGroup>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

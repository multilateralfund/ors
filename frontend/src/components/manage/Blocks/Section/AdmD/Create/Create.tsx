import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import { produce } from 'immer'

import Field from '@ors/components/manage/Form/Field'

export default function AdmD(props: any) {
  const { emptyForm, form, section, setForm } = props
  const { rows = [] } = emptyForm.adm_d || {}

  return (
    <>
      <Box>
        <Typography component="h2" variant="h6">
          {section.title}
        </Typography>
        <List>
          {rows.map((row: any) => (
            <ListItem key={row.id} className="flex-col items-start pl-0">
              <Typography className="text-lg">{row.text}</Typography>
              <FormGroup className="w-full pl-10">
                {row.choices.map((choice: any) => {
                  const checked =
                    form.adm_d[row.id]?.value_choice_id === choice.id

                  return (
                    <div id={`choice-${choice.id}`} key={choice.id}>
                      <FormControlLabel
                        label={choice.value}
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setForm(
                                produce((form: any) => {
                                  if (!checked) {
                                    return
                                  }
                                  if (!form.adm_d[row.id]) {
                                    form.adm_d[row.id] = {
                                      row_id: row.id,
                                      value_choice_id: null,
                                      value_text: null,
                                    }
                                  }
                                  const choiceEl = document.querySelector(
                                    `#choice-${choice.id} textarea`,
                                  ) as HTMLTextAreaElement
                                  form.adm_d[row.id].value_text =
                                    choiceEl?.value || null
                                  form.adm_d[row.id].value_choice_id = choice.id
                                }),
                              )
                            }}
                          />
                        }
                      />
                      {!!choice.text_label && (
                        <FormHelperText className="text-lg">
                          {choice.text_label}
                        </FormHelperText>
                      )}
                      {choice.with_text && (
                        <Field
                          FieldProps={{ className: 'mb-0' }}
                          disabled={!checked}
                          type="textarea"
                          value={form.adm_d[row.id]?.value_text}
                          onChange={(event: any) => {
                            setForm(
                              produce((form: any) => {
                                if (!form.adm_d[row.id]) {
                                  form.adm_d[row.id] = {
                                    row_id: row.id,
                                    value_choice_id: null,
                                    value_text: null,
                                  }
                                }
                                form.adm_d[row.id].value_text =
                                  event.target.value
                              }),
                            )
                          }}
                        />
                      )}
                    </div>
                  )
                })}
                {!row.choices.length && (
                  <Field
                    FieldProps={{ className: 'mb-0 mt-4' }}
                    type="textarea"
                    value={form.adm_d?.[row.id]?.value_text}
                    onChange={(event: any) => {
                      setForm(
                        produce((form: any) => {
                          if (!form.adm_d[row.id]) {
                            form.adm_d[row.id] = {
                              ...row,
                              row_id: row.id,
                            }
                          }
                          form.adm_d[row.id].value_text = event.target.value
                        }),
                      )
                    }}
                  />
                )}
              </FormGroup>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

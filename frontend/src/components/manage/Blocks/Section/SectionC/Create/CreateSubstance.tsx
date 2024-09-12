import { ApiSubstance } from '@ors/types/api_substances'

import { ChangeEvent, FormEventHandler, useState } from 'react'

import { Button, Divider } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import api from '@ors/helpers/Api/_api'

import { CreateSubstanceProps } from './types'

function CreateSubstance(props: CreateSubstanceProps) {
  const { onCancel, onSubmit } = props

  const initialState = {
    description: '',
    formula: '',
    gwp: '',
    name: '',
    odp: '',
  }
  const [form, setForm] = useState(initialState)

  function handleChangeFieldValue(name: string) {
    return function (evt: ChangeEvent<HTMLInputElement>) {
      setForm(function (prev) {
        return { ...prev, [name]: evt.target.value }
      })
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault()
    const resp = await api<ApiSubstance>('/api/substances', {
      data: form,
      method: 'POST',
    })
    if (resp) {
      setForm(initialState)
      onSubmit(resp)
    }
  }

  return (
    <div>
      <p>
        {
          "Please make sure the substance you are about to add doesn't already exist in the database by searching the existing substances or blends."
        }
      </p>
      <form onSubmit={handleSubmit}>
        <Field
          InputLabel={{ label: 'Name' }}
          disabled={false}
          value={form.name}
          onChange={handleChangeFieldValue('name')}
          required
        />
        <Field
          InputLabel={{ label: 'Description' }}
          disabled={false}
          value={form.description}
          onChange={handleChangeFieldValue('description')}
        />
        <Divider className="my-4" />
        <div className="flex gap-x-4">
          <Field
            InputLabel={{ label: 'ODP' }}
            InputProps={{ type: 'number' }}
            disabled={false}
            type="number"
            value={form.odp}
            onChange={handleChangeFieldValue('odp')}
          />
          <Field
            InputLabel={{ label: 'GWP' }}
            InputProps={{ type: 'number' }}
            disabled={false}
            value={form.gwp}
            onChange={handleChangeFieldValue('gwp')}
          />
        </div>
        <Field
          InputLabel={{ label: 'Formula' }}
          disabled={false}
          value={form.formula}
          onChange={handleChangeFieldValue('formula')}
        />

        <Divider className="my-4" />

        <div className="flex flex-row-reverse gap-x-2">
          <Button onClick={onCancel}>Close</Button>
          <Button
            className="text-base"
            color="secondary"
            type="submit"
            variant="contained"
          >
            Submit substance
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateSubstance

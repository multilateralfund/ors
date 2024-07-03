import { useState } from 'react'

import { Button, Divider } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import api from '@ors/helpers/Api/_api'

function CreateSubstance(props) {
  const { onCancel, onSubmit } = props

  const initialState = {
    description: '',
    formula: '',
    gwp: '',
    name: '',
    odp: '',
  }
  const [form, setForm] = useState(initialState)

  function handleChangeFieldValue(name) {
    return function (evt) {
      setForm(function (prev) {
        return { ...prev, [name]: evt.target.value }
      })
    }
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    const resp = await api('/api/substances', {
      data: form,
      method: 'POST',
    })
    setForm(initialState)
    onSubmit(resp)
  }

  return (
    <div>
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
          required
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
            required
          />
          <Field
            InputLabel={{ label: 'GWP' }}
            InputProps={{ type: 'number' }}
            disabled={false}
            value={form.gwp}
            onChange={handleChangeFieldValue('gwp')}
            required
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

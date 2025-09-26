import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { useSnackbar } from 'notistack'
import { api, getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects.ts'
import { useCallback, useEffect, useState } from 'react'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import dayjs from 'dayjs'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput.tsx'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import PListingTable from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListingTable.tsx'

const orderFieldData = (fd: MetaProjectFieldData) => {
  const orderedFieldData = []

  for (const key of Object.keys(fd)) {
    orderedFieldData.push({ name: key, ...fd[key] })
  }
  orderedFieldData.sort((a, b) => a.order - b.order)

  return orderedFieldData
}
export const MetaProjectEdit = (props: {
  mp: MetaProjectDetailType
  refreshMetaProjectDetails: () => void
  onCancel: () => void
}) => {
  const { mp, refreshMetaProjectDetails, onCancel } = props

  const { enqueueSnackbar } = useSnackbar()

  const projects = getResults<ProjectType>(mp?.projects ?? [])

  const loadInitialState = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = mp?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      result[key] = fd[key as keyof MetaProjectFieldData].value
    }

    return result
  }, [mp])

  const [form, setForm] = useState(loadInitialState)

  useEffect(() => {
    setForm(loadInitialState)
  }, [loadInitialState, mp])

  const fieldData = orderFieldData(mp?.field_data ?? {})

  const handleSave = async () => {
    const result = await api(`api/meta-projects/${mp.id}/`, {
      data: form,
      method: 'PUT',
    })
    refreshMetaProjectDetails()
    enqueueSnackbar('Saved!', { variant: 'success' })
  }

  const changeSimpleInput = useCallback(
    (name: string, opts?: { numeric?: boolean }) => {
      return (evt: any) => {
        setForm((prev) => {
          let newValue = evt.target.value || null
          if (opts?.numeric && isNaN(Number(newValue))) {
            newValue = prev[name]
          }
          return { ...prev, [name]: newValue }
        })
      }
    },
    [setForm],
  )

  const getFieldValue = (name: string, missing?: string) => {
    const formValue = form[name]
    const computedValue = mp.computed_field_data[name]
    const value = formValue === null ? computedValue : formValue
    return value || (missing ?? '')
  }

  const valueIsComputed = (name: string) => {
    const formValue = form[name]
    const computedValue = mp.computed_field_data[name]

    return formValue === null && computedValue !== undefined
  }

  const renderFieldData = (fieldData: any) => {
    return fieldData.map((fd: any) => {
      const fieldValue = getFieldValue(fd.name)
      const isComputed = valueIsComputed(fd.name)
      return (
        <div key={fd.name} className="py-2">
          <Label htmlFor={fd.name}>
            <span className="mt-2 flex justify-between">
              {fd.label}
              {isComputed ? (
                <span
                  className="border-1 rounded-xl border border-solid px-1 text-primary"
                  title="Based on contained projects."
                >
                  Computed
                </span>
              ) : null}
            </span>
          </Label>
          {fd.type === 'DateTimeField' ? (
            <DateInput
              id={fd.name}
              className="BPListUpload !ml-0 h-10 w-40"
              value={fieldValue.toString()}
              formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
              onChange={changeSimpleInput(fd.name)}
            />
          ) : null}
          {fd.type !== 'DateTimeField' ? (
            <SimpleInput
              id={fd.name}
              label=""
              type="text"
              value={fieldValue}
              onChange={changeSimpleInput(fd.name, {
                numeric: fd.type === 'DecimalField',
              })}
            />
          ) : null}
        </div>
      )
    })
  }

  return (
    <Dialog open={!!mp?.id} onClose={onCancel} fullWidth={true} maxWidth={'xl'}>
      <DialogTitle>MYA: {mp?.new_code}</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Projects</Typography>
        <PListingTable
          mode="listing"
          projects={projects as any}
          filters={{}}
          enablePagination={false}
        />
        <Typography variant="h6">Details</Typography>
        <div className="flex gap-x-8">
          <div className="flex-grow">
            {renderFieldData(
              fieldData.slice(0, Math.ceil(fieldData.length / 2)),
            )}
          </div>
          <div className="flex-grow">
            {renderFieldData(fieldData.slice(Math.ceil(fieldData.length / 2)))}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="hover:bg-white hover:text-primary"
          onClick={onCancel}
        >
          Close
        </Button>
        <Button
          className="bg-primary text-white hover:text-mlfs-hlYellow"
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

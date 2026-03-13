import { useCallback, useEffect, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'

import { orderFieldData } from '../UpdateMyaData/MetaProjectEdit'
import PListingTable from '../ProjectsListing/PListingTable'
import { monetaryFields } from '../UpdateMyaData/constants'
import {
  formatFieldLabel,
  getFormattedDecimalValue,
  getFormattedNumericValue,
  getProjectDuration,
} from '../utils'
import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '../UpdateMyaData/types'
import { getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects'

import { CircularProgress, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { filter, split } from 'lodash'

const projectDuration = 'project_duration'

const ProjectMyaUpdatesView = ({
  metaprojectData,
}: {
  metaprojectData?: MetaProjectDetailType | null
}) => {
  const projects = getResults<ProjectType>([
    ...(metaprojectData?.projects ?? []),
    ...(metaprojectData?.possible_projects ?? []),
  ])

  const formatMetaprojectData = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = metaprojectData?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      const fdEntry = fd[key as keyof MetaProjectFieldData]
      result[key] =
        fdEntry.type === 'DecimalField'
          ? getFormattedDecimalValue(fdEntry.value as string)
          : fdEntry.value
    }

    return result
  }, [metaprojectData])

  const [mpData, setMpData] = useState(formatMetaprojectData)

  useEffect(() => {
    setMpData(formatMetaprojectData)
  }, [formatMetaprojectData, metaprojectData])

  const fieldData = orderFieldData(metaprojectData?.field_data ?? {})

  const computeProjectDuration = () =>
    getProjectDuration({
      project_start_date: getBaseFieldValue('start_date'),
      project_end_date: getBaseFieldValue('end_date'),
    })

  const getBaseFieldValue = (name: string) => {
    const formValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return formValue === null ? computedValue : formValue
  }

  const getFieldValue = (name: string, missing?: string) =>
    name === projectDuration
      ? computeProjectDuration()
      : getBaseFieldValue(name) || (missing ?? '')

  const valueIsComputed = (name: string) => {
    const formValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return (
      name === projectDuration ||
      (formValue === null && computedValue !== undefined)
    )
  }

  const fieldComponent = (fd: any) => {
    const fieldValue = getFieldValue(fd.name)

    switch (fd.type) {
      case 'DateTimeField':
        return (fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || 'N/A'
      case 'DecimalField':
        return fieldValue
          ? `${monetaryFields.includes(fd.name) ? '$' : ''}${getFormattedNumericValue(fieldValue, 2)}`
          : 'N/A'
      default:
        return fieldValue ? getFormattedNumericValue(fieldValue, 0) : 'N/A'
    }
  }

  const renderFieldData = (fieldData: any, withLabel: boolean = true) => {
    return fieldData.map((fd: any) => {
      const isComputed = valueIsComputed(fd.name)

      return (
        <div key={fd.name} className="py-2">
          {withLabel && (
            <Label htmlFor={fd.name} className="mt-2 font-semibold">
              {formatFieldLabel(fd.label)}
            </Label>
          )}
          <span className="mt-2 flex gap-3">
            {fieldComponent(fd)}
            {isComputed ? (
              <span
                className="border-1 flex items-center rounded-lg border border-solid border-[#2E708E] px-3 font-semibold italic text-[#2E708E]"
                title="Based on contained projects."
              >
                Computed
              </span>
            ) : null}
            {!withLabel && (
              <span className="flex items-center whitespace-nowrap">
                {split(formatFieldLabel(fd.label), '(')[1]?.split(')')[0]}
              </span>
            )}
          </span>
        </div>
      )
    })
  }

  const getFilteredFields = (label: string) =>
    filter(fieldData, (entry) => entry.label.toLowerCase().includes(label))

  const dateFields = getFilteredFields('date')
  const baselineFields = getFilteredFields('baseline')
  const targetFields = getFilteredFields('target')
  const phaseOutFields = getFilteredFields('phase-out')
  const startingPointFields = getFilteredFields('starting point')
  const costEffectivenessFields = getFilteredFields('cost effectiveness')

  const groupFields = (title: string, fields: any) => (
    <div className="flex flex-col">
      <Label className="m-auto w-fit font-semibold">{title}</Label>
      <div className="flex flex-wrap gap-6">
        {renderFieldData(fields, false)}
      </div>
    </div>
  )

  return (
    <div>
      {!!metaprojectData?.id ? (
        <div className="flex flex-col gap-y-3">
          <Typography variant="h6">
            MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
            {metaprojectData?.lead_agency?.name || '-'}
          </Typography>
          <Typography variant="h6">Projects under this MYA</Typography>
          <PListingTable
            mode="listing"
            projects={projects as any}
            filters={{}}
            enablePagination={false}
          />
          <div>
            <Typography variant="h6">Details</Typography>
            <div className="flex gap-x-8">
              <div className="flex-grow">
                {renderFieldData(fieldData.slice(0, 3))}
                <div className="flex gap-6">{renderFieldData(dateFields)}</div>
                {renderFieldData(fieldData.slice(5, 6))}
                {groupFields('Baseline', baselineFields)}
                {groupFields('Target in the last year', targetFields)}
              </div>
              <div className="flex-grow">
                {groupFields('Phase-out', phaseOutFields)}
                {groupFields(
                  'Starting point for aggregate reductions in consumption or production',
                  startingPointFields,
                )}
                {renderFieldData(fieldData).slice(16, 20)}
                {groupFields('Cost effectiveness', costEffectivenessFields)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CircularProgress color="inherit" size="24px" className="ml-1.5" />
      )}
    </div>
  )
}

export default ProjectMyaUpdatesView

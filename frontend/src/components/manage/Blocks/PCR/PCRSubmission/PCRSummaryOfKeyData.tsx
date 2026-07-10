import { ChangeEvent, ReactNode, useContext, useMemo, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { textAreaClassname } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import useApi from '@ors/hooks/useApi'
import { ApiSubstance } from '@ors/types/api_substances'
import { ProjectType } from '@ors/types/api_projects'
import {
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCRSummaryOfKeyDataType,
} from '../interfaces'

import { Divider, IconButton, TextareaAutosize } from '@mui/material'
import { IoTrash } from 'react-icons/io5'

type SummaryTableColumn = {
  label: string
  field?: keyof ProjectType
}

type SubstanceOption = ApiSubstance & { label: string }

const summaryTableColumns: SummaryTableColumn[] = [
  { label: 'Project code', field: 'code' },
  { label: 'Type', field: 'project_type' },
  { label: 'Sector', field: 'sector' },
  { label: 'Agency', field: 'agency' },
  { label: 'Tranche(s)', field: 'tranche' },
  { label: 'Date approved' },
  { label: 'Actual date of completion' },
  { label: 'Funds approved' },
  { label: 'ODP phase-out (Approved)' },
  { label: 'ODP phase out (Actual)' },
  { label: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Approved)' },
  { label: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Actual)' },
]

const createAlternativeTechnology = (): PCRAlternativeTechnologyType => ({
  substance_from: null,
  substance_to: null,
})

const createEnterprise = (): PCREnterpriseType => ({
  name: '',
  address: '',
})

const createSummaryData = (projectId: number): PCRSummaryOfKeyDataType => ({
  project_id: projectId,
  funds_disbursed: '',
  planned_date_of_completion: '',
  alternative_technologies: [createAlternativeTechnology()],
  enterprises: [createEnterprise()],
})

const formatProjectValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(formatProjectValue).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>

    return formatProjectValue(
      objectValue.name ?? objectValue.code ?? objectValue.label,
    )
  }

  return ''
}

const FieldGroup = ({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) => (
  <div className="flex flex-col gap-y-4">
    {title && <h3 className="text-xl font-medium">{title}</h3>}
    {children}
  </div>
)

const EmptyField = ({ label }: { label: string }) => (
  <div>
    <Label>{label}</Label>
    <div className="h-10 w-40 rounded-lg border border-solid border-gray-300 bg-gray-50" />
  </div>
)

const SubstanceSelect = ({
  id,
  label,
  onChange,
  options,
  value,
}: {
  id: string
  label: string
  onChange: (value: number | null) => void
  options: SubstanceOption[]
  value: number | null
}) => (
  <div className="min-w-56 sm:min-w-64">
    <Label htmlFor={id}>{label}</Label>
    <Field
      id={id}
      widget="autocomplete"
      options={options}
      value={options.find((option) => option.id === value) ?? null}
      onChange={(_, option: any) => onChange(option?.id ?? null)}
      getOptionLabel={(option: any) => option?.name ?? ''}
      isOptionEqualToValue={(option: any, selected: any) =>
        option.id === selected.id
      }
      FieldProps={{ className: 'mb-0 w-full' }}
    />
  </div>
)

const PCRSummaryOfKeyData = () => {
  const { PCRData, pcrMetaproject, setPCRData } = useContext(PCRDataContext)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const projects = pcrMetaproject.data?.projects ?? []

  const { data: substances = [] } = useApi<ApiSubstance[]>({
    options: {
      withStoreCache: true,
    },
    path: 'api/substances/',
  })

  const substanceOptions = useMemo(
    () =>
      [...(substances ?? [])]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((substance) => ({ ...substance, label: substance.name })),
    [substances],
  )

  const editingProject = projects.find(
    (project) => project.id === editingProjectId,
  )
  const summaryData = editingProjectId
    ? (PCRData.summary_of_key_data.find(
        (entry) => entry.project_id === editingProjectId,
      ) ?? createSummaryData(editingProjectId))
    : null

  const updateSummaryData = (
    updater: (data: PCRSummaryOfKeyDataType) => PCRSummaryOfKeyDataType,
    fieldName: string,
  ) => {
    if (!editingProjectId) {
      return
    }

    setPCRData((previousData) => {
      const sectionData = previousData.summary_of_key_data ?? []
      const projectDataIndex = sectionData.findIndex(
        (entry) => entry.project_id === editingProjectId,
      )
      const currentProjectData =
        sectionData[projectDataIndex] ?? createSummaryData(editingProjectId)
      const updatedProjectData = updater(currentProjectData)

      return {
        ...previousData,
        summary_of_key_data:
          projectDataIndex === -1
            ? [...sectionData, updatedProjectData]
            : sectionData.map((entry, index) =>
                index === projectDataIndex ? updatedProjectData : entry,
              ),
      }
    }, fieldName)
  }

  const updateAlternativeTechnology = (
    index: number,
    field: keyof PCRAlternativeTechnologyType,
    value: number | null,
  ) => {
    updateSummaryData(
      (projectData) => ({
        ...projectData,
        alternative_technologies: projectData.alternative_technologies.map(
          (entry, entryIndex) =>
            entryIndex === index ? { ...entry, [field]: value } : entry,
        ),
      }),
      field,
    )
  }

  const updateEnterprise = (
    index: number,
    field: keyof PCREnterpriseType,
    value: string,
  ) => {
    updateSummaryData(
      (projectData) => ({
        ...projectData,
        enterprises: projectData.enterprises.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry,
        ),
      }),
      field,
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[2300px] border-collapse text-left">
          <thead>
            <tr>
              {summaryTableColumns.map(({ label }) => (
                <th
                  key={label}
                  className="min-w-36 border border-solid border-primary bg-primary p-2 align-top font-medium text-white"
                >
                  {label}
                </th>
              ))}
              <th className="w-24 border border-solid border-primary bg-primary p-2 align-top font-medium text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  className="border border-solid border-primary p-3 text-center"
                  colSpan={summaryTableColumns.length + 1}
                >
                  No projects available.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id}>
                  {summaryTableColumns.map(({ label, field }) => (
                    <td
                      key={label}
                      className="border border-solid border-primary p-2 align-top"
                    >
                      {field ? formatProjectValue(project[field]) : ''}
                    </td>
                  ))}
                  <td className="border border-solid border-primary p-2 align-top">
                    <SubmitButton
                      title="Edit"
                      onSubmit={() => setEditingProjectId(project.id)}
                      className="h-8 !text-sm"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingProject && summaryData && (
        <div className="flex flex-col gap-y-6">
          <h2 className="text-2xl font-medium">
            Project {editingProject.code}
          </h2>

          <FieldGroup>
            <div className="flex flex-wrap gap-x-7 gap-y-4">
              <div>
                <Label htmlFor={`funds-disbursed-${editingProject.id}`}>
                  Funds disbursed
                </Label>
                <FormattedNumberInput
                  id={`funds-disbursed-${editingProject.id}`}
                  className="w-40"
                  value={summaryData.funds_disbursed}
                  withoutDefaultValue={true}
                  onChange={(event) =>
                    updateSummaryData(
                      (projectData) => ({
                        ...projectData,
                        funds_disbursed: event.target.value,
                      }),
                      'funds_disbursed',
                    )
                  }
                />
              </div>
              <div>
                <Label
                  htmlFor={`planned-date-of-completion-${editingProject.id}`}
                >
                  Planned date of completion
                </Label>
                <DateInput
                  id={`planned-date-of-completion-${editingProject.id}`}
                  className="w-48"
                  value={summaryData.planned_date_of_completion}
                  onChange={(event) =>
                    updateSummaryData(
                      (projectData) => ({
                        ...projectData,
                        planned_date_of_completion: event.target.value,
                      }),
                      'planned_date_of_completion',
                    )
                  }
                />
              </div>
              <EmptyField label="Planned duration (months)" />
              <EmptyField label="Actual duration (months)" />
              <EmptyField label="Delay (months)" />
            </div>
          </FieldGroup>

          <Divider />

          <FieldGroup title="Alternative technology">
            <div className="flex flex-col gap-y-4">
              {summaryData.alternative_technologies.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-x-7 gap-y-4"
                >
                  <SubstanceSelect
                    id={`substance-from-${editingProject.id}-${index}`}
                    label="Substance converted from"
                    options={substanceOptions}
                    value={entry.substance_from}
                    onChange={(value) =>
                      updateAlternativeTechnology(
                        index,
                        'substance_from',
                        value,
                      )
                    }
                  />
                  <SubstanceSelect
                    id={`substance-to-${editingProject.id}-${index}`}
                    label="Substance converted to"
                    options={substanceOptions}
                    value={entry.substance_to}
                    onChange={(value) =>
                      updateAlternativeTechnology(index, 'substance_to', value)
                    }
                  />
                  <IconButton
                    aria-label="Remove alternative technology"
                    onClick={() =>
                      updateSummaryData(
                        (projectData) => ({
                          ...projectData,
                          alternative_technologies:
                            projectData.alternative_technologies.filter(
                              (_, entryIndex) => entryIndex !== index,
                            ),
                        }),
                        'alternative_technologies',
                      )
                    }
                  >
                    <IoTrash className="fill-gray-400" size={18} />
                  </IconButton>
                </div>
              ))}
            </div>
            <SubmitButton
              title="Add alternative technology"
              onSubmit={() =>
                updateSummaryData(
                  (projectData) => ({
                    ...projectData,
                    alternative_technologies: [
                      ...projectData.alternative_technologies,
                      createAlternativeTechnology(),
                    ],
                  }),
                  'alternative_technologies',
                )
              }
              className="mr-auto h-8"
            />
          </FieldGroup>

          <Divider />

          <FieldGroup>
            <div className="flex flex-col gap-y-4">
              {summaryData.enterprises.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-x-7 gap-y-4"
                >
                  <div className="min-w-56 sm:min-w-64">
                    <Label
                      htmlFor={`enterprise-name-${editingProject.id}-${index}`}
                    >
                      Name of Enterprise
                    </Label>
                    <SimpleInput
                      id={`enterprise-name-${editingProject.id}-${index}`}
                      label=""
                      type="text"
                      value={entry.name}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateEnterprise(index, 'name', event.target.value)
                      }
                    />
                  </div>
                  <div className="min-w-72 flex-1">
                    <Label
                      htmlFor={`enterprise-address-${editingProject.id}-${index}`}
                    >
                      Address of enterprises
                    </Label>
                    <TextareaAutosize
                      id={`enterprise-address-${editingProject.id}-${index}`}
                      className={`${textAreaClassname} min-h-10 w-full pb-2`}
                      minRows={1}
                      style={STYLE}
                      value={entry.address}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        updateEnterprise(index, 'address', event.target.value)
                      }
                    />
                  </div>
                  <IconButton
                    aria-label="Remove enterprise"
                    onClick={() =>
                      updateSummaryData(
                        (projectData) => ({
                          ...projectData,
                          enterprises: projectData.enterprises.filter(
                            (_, entryIndex) => entryIndex !== index,
                          ),
                        }),
                        'enterprises',
                      )
                    }
                  >
                    <IoTrash className="fill-gray-400" size={18} />
                  </IconButton>
                </div>
              ))}
            </div>
            <SubmitButton
              title="Add enterprise"
              onSubmit={() =>
                updateSummaryData(
                  (projectData) => ({
                    ...projectData,
                    enterprises: [
                      ...projectData.enterprises,
                      createEnterprise(),
                    ],
                  }),
                  'enterprises',
                )
              }
              className="mr-auto h-8"
            />
          </FieldGroup>
        </div>
      )}
    </div>
  )
}

export default PCRSummaryOfKeyData

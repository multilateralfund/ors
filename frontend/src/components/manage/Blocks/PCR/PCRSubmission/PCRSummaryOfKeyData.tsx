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
import ViewTable from '@ors/components/manage/Form/ViewTable'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import useApi from '@ors/hooks/useApi'
import { ApiSubstance } from '@ors/types/api_substances'
import { ProjectType } from '@ors/types/api_projects'
import {
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRSummaryOfKeyDataType,
} from '../interfaces'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextareaAutosize,
} from '@mui/material'
import {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community'
import { FiEdit } from 'react-icons/fi'
import { IoTrash } from 'react-icons/io5'

type SubstanceOption = ApiSubstance & { label: string }
type DisposalTypeOption = { id: number; name: string; label: string }

const createAlternativeTechnology = (): PCRAlternativeTechnologyType => ({
  substance_from: null,
  substance_to: null,
})

const createEnterprise = (): PCREnterpriseType => ({
  name: '',
  address: '',
})

const createEquipment = (): PCREquipmentType => ({
  name: '',
  description: '',
  disposal_date: '',
  disposal_type: null,
})

const createSummaryData = (projectId: number): PCRSummaryOfKeyDataType => ({
  project_id: projectId,
  funds_disbursed: '',
  planned_date_of_completion: '',
  alternative_technologies: [createAlternativeTechnology()],
  enterprises: [createEnterprise()],
  equipments: [createEquipment()],
})

const formatProjectValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
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

const EmptyField = ({label}: { label: string }) => (
  <div>
    <Label>{label}</Label>
    <div className="h-10 w-40 rounded-lg border border-solid border-gray-300 bg-gray-50"/>
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
      FieldProps={{className: 'mb-0 w-full'}}
    />
  </div>
)

const DisposalTypeSelect = ({
  id,
  label,
  onChange,
  options,
  value,
}: {
  id: string
  label: string
  onChange: (value: number | null) => void
  options: DisposalTypeOption[]
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
      FieldProps={{className: 'mb-0 w-full'}}
    />
  </div>
)

const PCRSummaryOfKeyData = () => {
  const {PCRData, pcrMetaproject, setPCRData} = useContext(PCRDataContext)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const projects = pcrMetaproject.data?.projects ?? []

  const {data: substances = []} = useApi<ApiSubstance[]>({
    options: {
      withStoreCache: true,
    },
    path: 'api/substances/',
  })

  const substanceOptions = useMemo(
    () =>
      [...(substances ?? [])]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((substance) => ({...substance, label: substance.name})),
    [substances],
  )

  const disposalTypeOptions = [
    {id: 1, name: 'Disposal type 1', label: 'Disposal type 1'},
    {id: 2, name: 'Disposal type 2', label: 'Disposal type 2'},
    {id: 3, name: 'Disposal type 3', label: 'Disposal type 3'},
  ]

  const editingProject = projects.find(
    (project) => project.id === editingProjectId,
  )
  const summaryData = editingProjectId
    ? (PCRData.summary_of_key_data.find(
      (entry) => entry.project_id === editingProjectId,
    ) ?? createSummaryData(editingProjectId))
    : null

  const summaryTableColumnDefs = useMemo<ColDef<ProjectType>[]>(
    () => [
      {
        headerName: 'Project code',
        field: 'code',
        minWidth: 210,
        cellRenderer: (params: ICellRendererParams<ProjectType>) => (
          <div className="flex h-full items-center gap-x-2">
            <IconButton
              aria-label={`Edit project ${params.data?.code ?? ''}`}
              className="h-7 w-7"
              onClick={() => setEditingProjectId(params.data?.id ?? null)}
              size="small"
            >
              <FiEdit size={16}/>
            </IconButton>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        headerName: 'Type',
        minWidth: 160,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.project_type),
      },
      {
        headerName: 'Sector',
        minWidth: 160,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.sector),
      },
      {
        headerName: 'Agency',
        minWidth: 130,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.agency),
      },
      {
        headerName: 'Tranche(s)',
        minWidth: 110,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.tranche),
      },
      {
        headerName: 'Date approved',
        minWidth: 135,
      },
      {
        headerName: 'Actual date of completion',
        minWidth: 165,
      },
      {
        headerName: 'Funds approved',
        minWidth: 140,
      },
      {
        headerName: 'ODP phase-out (Approved)',
        minWidth: 170,
      },
      {
        headerName: 'ODP phase out (Actual)',
        minWidth: 160,
      },
      {
        headerName: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Approved)',
        minWidth: 230,
      },
      {
        headerName: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Actual)',
        minWidth: 220,
      },
    ],
    [],
  )

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
            entryIndex === index ? {...entry, [field]: value} : entry,
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
          entryIndex === index ? {...entry, [field]: value} : entry,
        ),
      }),
      field,
    )
  }
  const updateEquipment = (
    index: number,
    field: keyof PCREquipmentType,
    value: PCREquipmentType[typeof field],
  ) => {
    updateSummaryData(
      (projectData) => ({
        ...projectData,
        equipments: projectData.equipments.map((entry, entryIndex) =>
          entryIndex === index ? {...entry, [field]: value} : entry,
        ),
      }),
      field,
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <ViewTable<ProjectType>
        columnDefs={summaryTableColumnDefs}
        defaultColDef={{
          autoHeaderHeight: true,
          cellClass: 'ag-cell-ellipsed ag-cell-centered',
          headerClass: 'ag-text-center',
          resizable: true,
        }}
        enablePagination={false}
        rowData={projects}
        rowHeight={48}
        suppressCellFocus={true}
        withSeparators={true}
      />

      {editingProject && summaryData && (
        <Dialog
          aria-labelledby="pcr-summary-edit-dialog-title"
          fullWidth={true}
          maxWidth="xl"
          onClose={() => setEditingProjectId(null)}
          open={true}
          scroll="paper"
        >
          <DialogTitle id="pcr-summary-edit-dialog-title">
            Project {editingProject.code}
          </DialogTitle>
          <DialogContent dividers={true}>
            <div className="flex flex-col gap-y-6 py-2">
              <FieldGroup>
                <div className="flex flex-wrap gap-x-7 gap-y-4">
                  <div>
                    <Label htmlFor={`funds-disbursed-${editingProject.id}`}>
                      Funds disbursed
                    </Label>
                    <FormattedNumberInput
                      id={`funds-disbursed-${editingProject.id}`}
                      className="w-40 !m-0"
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
                      className="w-48 !m-0"
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
                  <EmptyField label="Planned duration (months)"/>
                  <EmptyField label="Actual duration (months)"/>
                  <EmptyField label="Delay (months)"/>
                </div>
              </FieldGroup>

              <Divider/>

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
                          updateAlternativeTechnology(
                            index,
                            'substance_to',
                            value,
                          )
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
                        <IoTrash className="fill-gray-400" size={18}/>
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

              <Divider/>

              <FieldGroup title="Fate of ODS-BASED PRODUCTION EQUIPMENT - List of equipment rendered unusable(baseline) (optional)">
                <div className="flex flex-col gap-y-4">
                  {summaryData.enterprises.map((entry, index) => (
                    <div
                      key={index}
                      className="grid max-w-5xl grid-cols-1 items-start gap-4 md:grid-cols-[16rem_minmax(24rem,36rem)_auto]"
                    >
                      <div className="w-full">
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
                      <div className="w-full">
                        <Label
                          htmlFor={`enterprise-address-${editingProject.id}-${index}`}
                        >
                          Address of enterprises
                        </Label>
                        <TextareaAutosize
                          id={`enterprise-address-${editingProject.id}-${index}`}
                          className={`${textAreaClassname} min-h-24 w-full pb-2`}
                          minRows={3}
                          style={STYLE}
                          value={entry.address}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            updateEnterprise(
                              index,
                              'address',
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <IconButton
                        aria-label="Remove enterprise"
                        className="mt-7 justify-self-start"
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
                        <IoTrash className="fill-gray-400" size={18}/>
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

              <Divider/>

              <FieldGroup>
                <div className="flex flex-col gap-y-4">
                  {summaryData.equipments.map((entry, index) => (
                    <div
                      key={index}
                      className="grid max-w-[84rem] grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-[16rem_minmax(22rem,28rem)_16rem_14rem_auto]"
                    >
                      <div className="w-full">
                        <Label
                          htmlFor={`equipment-name-${editingProject.id}-${index}`}
                        >
                          Name of equipment
                        </Label>
                        <SimpleInput
                          id={`equipment-name-${editingProject.id}-${index}`}
                          label=""
                          type="text"
                          value={entry.name}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            updateEquipment(index, 'name', event.target.value)
                          }
                        />
                      </div>
                      <div className="w-full md:col-span-2 xl:col-span-1">
                        <Label
                          htmlFor={`equipment-description-${editingProject.id}-${index}`}
                        >
                          Description
                        </Label>
                        <TextareaAutosize
                          id={`equipment-description-${editingProject.id}-${index}`}
                          className={`${textAreaClassname} min-h-24 w-full pb-2`}
                          minRows={3}
                          style={STYLE}
                          value={entry.description}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            updateEquipment(
                              index,
                              'description',
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <DisposalTypeSelect
                        id={`equipment-disposal_type-${editingProject.id}-${index}`}
                        label="Disposal type"
                        options={disposalTypeOptions}
                        value={entry.disposal_type}
                        onChange={(value) =>
                          updateEquipment(index, 'disposal_type', value)
                        }
                      />
                      <div className="w-full">
                        <Label
                          htmlFor={`equipment-disposal_date-${editingProject.id}-${index}`}
                        >
                          Date of disposal
                        </Label>
                        <DateInput
                          id={`equipment-disposal_date-${editingProject.id}-${index}`}
                          className="w-full !m-0"
                          value={entry.disposal_date}
                          onChange={(event) =>
                            updateEquipment(
                              index,
                              'disposal_date',
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <IconButton
                        aria-label="Remove equipment"
                        className="mt-7 justify-self-start"
                        onClick={() =>
                          updateSummaryData(
                            (projectData) => ({
                              ...projectData,
                              equipments: projectData.equipments.filter(
                                (_, entryIndex) => entryIndex !== index,
                              ),
                            }),
                            'equipments',
                          )
                        }
                      >
                        <IoTrash className="fill-gray-400" size={18}/>
                      </IconButton>
                    </div>
                  ))}
                </div>
                <SubmitButton
                  title="Add equipment"
                  onSubmit={() =>
                    updateSummaryData(
                      (projectData) => ({
                        ...projectData,
                        equipments: [
                          ...projectData.equipments,
                          createEquipment(),
                        ],
                      }),
                      'equipments',
                    )
                  }
                  className="mr-auto h-8"
                />
              </FieldGroup>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              className="bg-primary text-white hover:text-mlfs-hlYellow"
              onClick={() => setEditingProjectId(null)}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}

export default PCRSummaryOfKeyData

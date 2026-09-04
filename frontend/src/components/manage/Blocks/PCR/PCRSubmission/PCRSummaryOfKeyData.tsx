import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  SubmitButton,
  ErrorsList,
  FieldErrorIndicator,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { textAreaClassname } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import useApi from '@ors/hooks/useApi'
import { ApiSubstance } from '@ors/types/api_substances'
import { ProjectType } from '@ors/types/api_projects'
import {
  groupSummaryOfKeyDataErrors,
  formatErrors,
  checkHasErrors,
  hasSectionErrors,
} from '../utils'
import {
  summaryOfKeyDataField,
  defaultSummaryOfKeyDataErrors,
} from '../constants'
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
  IconButton,
  Tab,
  Tabs,
  TextareaAutosize,
} from '@mui/material'
import {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community'
import { filter, find, omit } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { FiEdit } from 'react-icons/fi'

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

const cloneSummaryData = (
  data: PCRSummaryOfKeyDataType,
): PCRSummaryOfKeyDataType => ({
  ...data,
  alternative_technologies: data.alternative_technologies.map((entry) => ({
    ...entry,
  })),
  enterprises: data.enterprises.map((entry) => ({ ...entry })),
  equipments: data.equipments.map((entry) => ({ ...entry })),
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

const formatNumberProjectValue = (
  value: null | number | string | undefined,
  minDigits?: number,
  maxDigits?: number,
) => formatNumberValue(value ?? null, minDigits, maxDigits) ?? ''

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
  label?: string
  onChange: (value: number | null) => void
  options: SubstanceOption[]
  value: number | null
}) => (
  <div className="min-w-56 sm:min-w-64">
    {label && <Label htmlFor={id}>{label}</Label>}
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
      FieldProps={{ className: 'BPListUpload mb-0 w-full' }}
    />
  </div>
)

const DisposalTypeSelect = ({
  id,
  label,
  labelClassName,
  onChange,
  options,
  value,
  errors,
}: {
  id: string
  label: string
  labelClassName?: string
  onChange: (value: number | null) => void
  options: DisposalTypeOption[]
  value: number | null
  errors: Record<string, any>
}) => (
  <div className="min-w-56 sm:min-w-64">
    <div className={labelClassName}>
      <Label htmlFor={id}>{label}</Label>
    </div>
    <div className="flex items-center">
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
        FieldProps={{ className: 'BPListUpload mb-0 w-full' }}
      />
      <FieldErrorIndicator errors={errors} field="disposal_type" />
    </div>
  </div>
)

const PCRSummaryOfKeyData = () => {
  const { PCRData, pcrMetaproject, setPCRData, errors, setErrors } =
    useContext(PCRDataContext)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [currentTab, setCurrentTab] = useState(0)
  const [draftSummaryData, setDraftSummaryData] =
    useState<PCRSummaryOfKeyDataType | null>(null)
  const {
    data: metaproject,
    loaded: metaprojectLoaded,
    loading,
  } = pcrMetaproject
  const projects = metaproject?.projects ?? []

  const summaryOfKeyDataErrors = errors.summary_of_key_data
  const projectsErrors = summaryOfKeyDataErrors[summaryOfKeyDataField]
  const projectErrorIndex = Object.keys(projectsErrors).indexOf(
    String(editingProjectId),
  )

  const groupedErrors = useMemo(
    () =>
      !!editingProjectId
        ? groupSummaryOfKeyDataErrors(projectsErrors, editingProjectId)
        : defaultSummaryOfKeyDataErrors,
    [editingProjectId, JSON.stringify(summaryOfKeyDataErrors)],
  )

  const formattedErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(groupedErrors).map(([key, value]) => [
          key,
          formatErrors(value, undefined, key),
        ]),
      ),
    [groupedErrors],
  )

  const { alternativeTechnologiesErrors, enterprisesErrors, equipmentsErrors } =
    useMemo(
      () => ({
        alternativeTechnologiesErrors:
          groupedErrors.alternative_technologies?.alternative_technologies,
        enterprisesErrors: groupedErrors.enterprises?.enterprises,
        equipmentsErrors: groupedErrors.equipments?.equipments,
      }),
      [groupedErrors],
    )

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

  const disposalTypeOptions = [
    { id: 1, name: 'Disposal type 1', label: 'Disposal type 1' },
    { id: 2, name: 'Disposal type 2', label: 'Disposal type 2' },
    { id: 3, name: 'Disposal type 3', label: 'Disposal type 3' },
  ]

  const editingProject = projects.find(
    (project) => project.id === editingProjectId,
  )
  const getSummaryData = useCallback(
    (projectId: number) =>
      PCRData.summary_of_key_data.find(
        (entry) => entry.project_id === projectId,
      ) ?? createSummaryData(projectId),
    [PCRData.summary_of_key_data],
  )
  const summaryData = draftSummaryData

  const closeDialog = () => {
    setEditingProjectId(null)
    setDraftSummaryData(null)
    setCurrentTab(0)
  }

  const openDialog = useCallback(
    (projectId: number | null | undefined) => {
      if (!projectId) {
        return
      }
      setEditingProjectId(projectId)
      setDraftSummaryData(cloneSummaryData(getSummaryData(projectId)))
      setCurrentTab(0)
    },
    [getSummaryData],
  )

  const saveSummaryData = () => {
    if (!editingProjectId || !draftSummaryData) {
      closeDialog()
      return
    }

    setPCRData((previousData) => {
      const sectionData = previousData.summary_of_key_data ?? []
      const projectDataIndex = sectionData.findIndex(
        (entry) => entry.project_id === editingProjectId,
      )

      return {
        ...previousData,
        summary_of_key_data:
          projectDataIndex === -1
            ? [...sectionData, draftSummaryData]
            : sectionData.map((entry, index) =>
                index === projectDataIndex ? draftSummaryData : entry,
              ),
      }
    }, 'summary_of_key_data')
    closeDialog()
  }

  const summaryTableColumnDefs = useMemo<ColDef<ProjectType>[]>(
    () => [
      {
        headerName: 'Project code',
        field: 'code',
        minWidth: 210,
        cellRenderer: (params: ICellRendererParams<ProjectType>) => {
          const hasErrors = find(
            Object.entries(projectsErrors),
            ([key, value]: [string, { errors: Record<string, any> }[]]) =>
              Number(key) === params.data?.id &&
              Object.values(value[0].errors).some(checkHasErrors),
          )

          return (
            <div className="flex h-full items-center gap-x-2">
              <IconButton
                aria-label={`Edit project ${params.data?.code ?? ''}`}
                className="h-7 w-7"
                onClick={() => openDialog(params.data?.id)}
                size="small"
              >
                <FiEdit size={16} />
              </IconButton>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {params.value}
              </span>
              {!!hasErrors && <SectionErrorIndicator errors={[]} />}
            </div>
          )
        },
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
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.date_approved),
      },
      {
        headerName: 'Actual date of completion',
        minWidth: 165,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatProjectValue(params.data?.actual_date_of_completion),
      },
      {
        headerName: 'Funds approved',
        minWidth: 140,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatNumberProjectValue(params.data?.funds_approved, 0, 0),
      },
      {
        headerName: 'ODP phase-out (Approved)',
        minWidth: 170,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatNumberProjectValue(params.data?.odp_phase_out_approved, 1, 1),
      },
      {
        headerName: 'ODP phase out (Actual)',
        minWidth: 160,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatNumberProjectValue(params.data?.odp_phase_out_actual, 1, 1),
      },
      {
        headerName: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Approved)',
        minWidth: 230,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatNumberProjectValue(
            params.data?.hfc_phase_down_co2_approved,
            0,
            0,
          ),
      },
      {
        headerName: 'HFCs PHASED-DOWN (CO2 eq-tonnes) (Actual)',
        minWidth: 220,
        valueGetter: (params: ValueGetterParams<ProjectType>) =>
          formatNumberProjectValue(
            params.data?.hfc_phase_down_co2_actual,
            0,
            0,
          ),
      },
    ],
    [openDialog, summaryOfKeyDataErrors],
  )

  const TabLabel = ({ field, label }: { field: string; label: string }) => {
    const tabErrors = groupedErrors[field as keyof typeof groupedErrors]

    return (
      <div className="relative flex items-center justify-between gap-x-2">
        <div className="leading-tight">{label}</div>
        {!!tabErrors && hasSectionErrors(tabErrors) && (
          <SectionErrorIndicator errors={[]} />
        )}
      </div>
    )
  }

  const updateSummaryData = (
    updater: (data: PCRSummaryOfKeyDataType) => PCRSummaryOfKeyDataType,
  ) => {
    setDraftSummaryData((currentData) =>
      currentData ? updater(currentData) : currentData,
    )
  }

  const updateAlternativeTechnology = (
    index: number,
    field: keyof PCRAlternativeTechnologyType,
    value: number | null,
  ) => {
    updateSummaryData((projectData) => ({
      ...projectData,
      alternative_technologies: projectData.alternative_technologies.map(
        (entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const updateEnterprise = (
    index: number,
    field: keyof PCREnterpriseType,
    value: string,
  ) => {
    updateSummaryData((projectData) => ({
      ...projectData,
      enterprises: projectData.enterprises.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }
  const updateEquipment = (
    index: number,
    field: keyof PCREquipmentType,
    value: PCREquipmentType[typeof field],
  ) => {
    updateSummaryData((projectData) => ({
      ...projectData,
      equipments: projectData.equipments.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const updateErrors = (field: string, index: number) => {
    setErrors((prevData: Record<string, any[]>) => ({
      ...prevData,
      pcr_projects: prevData.pcr_projects.map((error, errorIndex) => {
        if (errorIndex !== projectErrorIndex) {
          return error
        }

        const filteredErrors = filter(
          error[field],
          (_, entryErrorIndex) => Number(entryErrorIndex) !== index,
        ).filter(checkHasErrors)

        return filteredErrors.length > 0
          ? {
              ...error,
              [field]: filteredErrors,
            }
          : omit(error, field)
      }),
    }))
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
        loading={loading || !metaprojectLoaded}
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
          onClose={closeDialog}
          open={true}
          scroll="paper"
        >
          <DialogTitle id="pcr-summary-edit-dialog-title">
            Project {editingProject.code}
          </DialogTitle>
          <DialogContent dividers={true}>
            <Tabs
              aria-label="summary-of-key-data-tabs"
              className="sectionsTabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{
                className: 'h-0',
                style: { transitionDuration: '150ms' },
              }}
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
            >
              <Tab
                id="general"
                aria-controls="general"
                label={<TabLabel field="general" label="General" />}
              />
              <Tab
                id="alternative-technology"
                aria-controls="alternative-technology"
                label={
                  <TabLabel
                    field="alternative_technologies"
                    label="Alternative technology"
                  />
                }
              />
              <Tab
                id="enterprises"
                aria-controls="enterprises"
                label={<TabLabel field="enterprises" label="Enterprises" />}
              />
              <Tab
                id="equipment"
                aria-controls="equipment"
                label={<TabLabel field="equipments" label="Equipment" />}
              />
            </Tabs>
            <div className="flex flex-col gap-y-6 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
              {currentTab === 0 && (
                <div>
                  {!!formattedErrors.general &&
                    formattedErrors.general.length > 0 && (
                      <ErrorsList errors={formattedErrors.general} />
                    )}
                  <FieldGroup>
                    <div className="flex flex-wrap gap-x-7 gap-y-4">
                      <div>
                        <Label htmlFor={`funds-disbursed-${editingProject.id}`}>
                          Funds disbursed
                        </Label>
                        <div className="flex items-center">
                          <FormattedNumberInput
                            id={`funds-disbursed-${editingProject.id}`}
                            className="!m-0 w-40"
                            value={summaryData.funds_disbursed}
                            withoutDefaultValue={true}
                            onChange={(event) =>
                              updateSummaryData((projectData) => ({
                                ...projectData,
                                funds_disbursed: event.target.value,
                              }))
                            }
                          />
                          <FieldErrorIndicator
                            errors={groupedErrors.general}
                            field="funds_disbursed"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor={`planned-date-of-completion-${editingProject.id}`}
                        >
                          Planned date of completion
                        </Label>
                        <div className="flex items-center">
                          <DateInput
                            id={`planned-date-of-completion-${editingProject.id}`}
                            className="!m-0 w-48"
                            value={summaryData.planned_date_of_completion}
                            onChange={(event) =>
                              updateSummaryData((projectData) => ({
                                ...projectData,
                                planned_date_of_completion: event.target.value,
                              }))
                            }
                          />
                          <FieldErrorIndicator
                            errors={groupedErrors.general}
                            field="planned_date_of_completion"
                          />
                        </div>
                      </div>
                      <EmptyField label="Planned duration (months)" />
                      <EmptyField label="Actual duration (months)" />
                      <EmptyField label="Delay (months)" />
                    </div>
                  </FieldGroup>
                </div>
              )}

              {currentTab === 1 && (
                <div>
                  {!!formattedErrors.alternative_technologies &&
                    formattedErrors.alternative_technologies.length > 0 && (
                      <ErrorsList
                        errors={formattedErrors.alternative_technologies}
                      />
                    )}
                  <FieldGroup title="Alternative technology">
                    <div className="flex flex-col gap-y-4">
                      <div className="flex gap-x-7">
                        <div className="min-w-56 sm:min-w-64">
                          <Label>Substance converted from</Label>
                        </div>
                        <div className="min-w-56 sm:min-w-64">
                          <Label>Substance converted to</Label>
                        </div>
                      </div>
                      {summaryData.alternative_technologies.map(
                        (entry, index) => (
                          <div
                            key={index}
                            className="flex flex-wrap items-end gap-x-7 gap-y-4"
                          >
                            <div className="flex items-center">
                              <SubstanceSelect
                                id={`substance-from-${editingProject.id}-${index}`}
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
                              <FieldErrorIndicator
                                errors={alternativeTechnologiesErrors?.[index]}
                                field="substance_from"
                              />
                            </div>
                            <div className="flex items-center">
                              <SubstanceSelect
                                id={`substance-to-${editingProject.id}-${index}`}
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
                              <FieldErrorIndicator
                                errors={alternativeTechnologiesErrors?.[index]}
                                field="substance_to"
                              />
                            </div>
                            <IconButton
                              aria-label="Remove alternative technology"
                              onClick={() => {
                                updateSummaryData((projectData) => ({
                                  ...projectData,
                                  alternative_technologies:
                                    projectData.alternative_technologies.filter(
                                      (_, entryIndex) => entryIndex !== index,
                                    ),
                                }))

                                updateErrors('alternative_technologies', index)
                              }}
                            >
                              <IoTrash className="fill-gray-400" size={18} />
                            </IconButton>
                          </div>
                        ),
                      )}
                    </div>
                    <SubmitButton
                      title="Add alternative technology"
                      onSubmit={() =>
                        updateSummaryData((projectData) => ({
                          ...projectData,
                          alternative_technologies: [
                            ...projectData.alternative_technologies,
                            createAlternativeTechnology(),
                          ],
                        }))
                      }
                      className="mr-auto h-8"
                    />
                  </FieldGroup>
                </div>
              )}

              {currentTab === 2 && (
                <div>
                  {!!formattedErrors.enterprises &&
                    formattedErrors.enterprises.length > 0 && (
                      <ErrorsList errors={formattedErrors.enterprises} />
                    )}
                  <FieldGroup>
                    <div className="flex flex-col gap-y-4">
                      <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-[16rem_minmax(24rem,36rem)_auto]">
                        <div>
                          <Label>Name of enterprise</Label>
                        </div>
                        <div>
                          <Label>Address of enterprise</Label>
                        </div>
                      </div>
                      {summaryData.enterprises.map((entry, index) => (
                        <div
                          key={index}
                          className="grid max-w-5xl grid-cols-1 items-start gap-4 md:grid-cols-[16rem_minmax(24rem,36rem)_auto]"
                        >
                          <div className="flex items-center">
                            <div className="w-full">
                              <SimpleInput
                                id={`enterprise-name-${editingProject.id}-${index}`}
                                label=""
                                type="text"
                                value={entry.name}
                                onChange={(
                                  event: ChangeEvent<HTMLInputElement>,
                                ) =>
                                  updateEnterprise(
                                    index,
                                    'name',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <FieldErrorIndicator
                              errors={enterprisesErrors?.[index]}
                              field="name"
                            />
                          </div>
                          <div className="flex items-center">
                            <div className="w-full">
                              <TextareaAutosize
                                id={`enterprise-address-${editingProject.id}-${index}`}
                                className={`${textAreaClassname} min-h-24 w-full pb-2`}
                                minRows={3}
                                style={STYLE}
                                value={entry.address}
                                onChange={(
                                  event: ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                  updateEnterprise(
                                    index,
                                    'address',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <FieldErrorIndicator
                              errors={enterprisesErrors?.[index]}
                              field="address"
                            />
                          </div>
                          <IconButton
                            aria-label="Remove enterprise"
                            className="mt-7 justify-self-start"
                            onClick={() => {
                              updateSummaryData((projectData) => ({
                                ...projectData,
                                enterprises: projectData.enterprises.filter(
                                  (_, entryIndex) => entryIndex !== index,
                                ),
                              }))

                              updateErrors('enterprises', index)
                            }}
                          >
                            <IoTrash className="fill-gray-400" size={18} />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                    <SubmitButton
                      title="Add enterprise"
                      onSubmit={() =>
                        updateSummaryData((projectData) => ({
                          ...projectData,
                          enterprises: [
                            ...projectData.enterprises,
                            createEnterprise(),
                          ],
                        }))
                      }
                      className="mr-auto h-8"
                    />
                  </FieldGroup>
                </div>
              )}

              {currentTab === 3 && (
                <div>
                  {!!formattedErrors.equipments &&
                    formattedErrors.equipments.length > 0 && (
                      <ErrorsList errors={formattedErrors.equipments} />
                    )}
                  <FieldGroup title="Fate of ODS-BASED PRODUCTION EQUIPMENT - List of equipment rendered unusable(baseline) (optional)">
                    <div className="flex flex-col gap-y-4">
                      <div className="hidden max-w-[84rem] grid-cols-[16rem_22rem_16rem_14rem_auto] gap-4 xl:grid">
                        <Label>Name of equipment</Label>
                        <Label>Description</Label>
                        <Label>Disposal type</Label>
                        <Label>Date of disposal</Label>
                      </div>
                      {summaryData.equipments.map((entry, index) => (
                        <div
                          key={index}
                          className="grid max-w-[84rem] grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-[16rem_22rem_16rem_14rem_auto]"
                        >
                          <div className="w-full">
                            <div className="xl:hidden">
                              <Label
                                htmlFor={`equipment-name-${editingProject.id}-${index}`}
                              >
                                Name of equipment
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <div className="w-full">
                                <SimpleInput
                                  id={`equipment-name-${editingProject.id}-${index}`}
                                  label=""
                                  type="text"
                                  value={entry.name}
                                  onChange={(
                                    event: ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    updateEquipment(
                                      index,
                                      'name',
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                              <FieldErrorIndicator
                                errors={equipmentsErrors?.[index]}
                                field="name"
                              />
                            </div>
                          </div>
                          <div className="w-full md:col-span-2 xl:col-span-1">
                            <div className="xl:hidden">
                              <Label
                                htmlFor={`equipment-description-${editingProject.id}-${index}`}
                              >
                                Description
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <TextareaAutosize
                                id={`equipment-description-${editingProject.id}-${index}`}
                                className={`${textAreaClassname} min-h-10 w-full pb-2`}
                                minRows={1}
                                style={STYLE}
                                value={entry.description}
                                onChange={(
                                  event: ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                  updateEquipment(
                                    index,
                                    'description',
                                    event.target.value,
                                  )
                                }
                              />
                              <FieldErrorIndicator
                                errors={equipmentsErrors?.[index]}
                                field="description"
                              />
                            </div>
                          </div>
                          <DisposalTypeSelect
                            id={`equipment-disposal_type-${editingProject.id}-${index}`}
                            label="Disposal type"
                            labelClassName="xl:hidden"
                            options={disposalTypeOptions}
                            value={entry.disposal_type}
                            onChange={(value) =>
                              updateEquipment(index, 'disposal_type', value)
                            }
                            errors={equipmentsErrors?.[index]}
                          />
                          <div className="w-full">
                            <div className="xl:hidden">
                              <Label
                                htmlFor={`equipment-disposal_date-${editingProject.id}-${index}`}
                              >
                                Date of disposal
                              </Label>
                            </div>
                            <div className="flex items-center">
                              <DateInput
                                id={`equipment-disposal_date-${editingProject.id}-${index}`}
                                className="!m-0 w-full flex-1"
                                value={entry.disposal_date}
                                onChange={(event) =>
                                  updateEquipment(
                                    index,
                                    'disposal_date',
                                    event.target.value,
                                  )
                                }
                              />
                              <FieldErrorIndicator
                                errors={equipmentsErrors?.[index]}
                                field="disposal_date"
                              />
                            </div>
                          </div>
                          <IconButton
                            aria-label="Remove equipment"
                            className="justify-self-start xl:self-center"
                            onClick={() => {
                              updateSummaryData((projectData) => ({
                                ...projectData,
                                equipments: projectData.equipments.filter(
                                  (_, entryIndex) => entryIndex !== index,
                                ),
                              }))

                              updateErrors('equipments', index)
                            }}
                          >
                            <IoTrash className="fill-gray-400" size={18} />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                    <SubmitButton
                      title="Add equipment"
                      onSubmit={() =>
                        updateSummaryData((projectData) => ({
                          ...projectData,
                          equipments: [
                            ...projectData.equipments,
                            createEquipment(),
                          ],
                        }))
                      }
                      className="mr-auto h-8"
                    />
                  </FieldGroup>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              className="border border-solid border-primary text-primary hover:bg-white"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-white hover:text-mlfs-hlYellow"
              onClick={saveSummaryData}
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

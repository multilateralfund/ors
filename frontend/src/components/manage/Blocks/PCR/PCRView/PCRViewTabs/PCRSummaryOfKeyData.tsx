import { useCallback, useContext, useMemo, useState } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  detailItem,
  dateDetailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import {
  FieldGroup,
  cloneSummaryData,
  getSummaryTableColumnDefs,
} from '../../PCRSubmission/PCRSummaryOfKeyData'
import { disposalTypeOptions } from '../../constants'
import { getComputedFields } from '../../utils'
import {
  PCRResponse,
  OptionsType,
  PCRSummaryOfKeyDataType,
} from '../../interfaces'
import { ProjectType } from '@ors/types/api_projects'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { FiEye } from 'react-icons/fi'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material'

const createSummaryData = (projectId: number): PCRSummaryOfKeyDataType => ({
  project_id: projectId,
  funds_disbursed: '',
  planned_date_of_completion: '',
  alternative_technologies: [],
  enterprises: [],
  equipments: [],
})

const getValueToDisplay = (options: OptionsType[], value: number | null) =>
  options.find((option) => option.id === value)?.name ?? ''

const PCRSummaryOfKeyData = ({ pcr }: { pcr: PCRResponse }) => {
  const { pcrMetaproject, substanceOptions } = useContext(PCRDataContext)
  const [crtProjectId, setCrtProjectId] = useState<number | null>(null)
  const [currentTab, setCurrentTab] = useState(0)
  const [summaryData, setSummaryData] =
    useState<PCRSummaryOfKeyDataType | null>(null)
  const {
    data: metaproject,
    loaded: metaprojectLoaded,
    loading,
  } = pcrMetaproject
  const projects = metaproject?.projects ?? []
  const crtProject = projects.find((project) => project.id === crtProjectId)

  const closeDialog = () => {
    setCrtProjectId(null)
    setSummaryData(null)
    setCurrentTab(0)
  }

  const openDialog = useCallback((projectId: number | null | undefined) => {
    if (!projectId) {
      return
    }

    const projectSummaryData =
      pcr.pcr_projects.find((entry) => entry.project_id === projectId) ??
      createSummaryData(projectId)

    setCrtProjectId(projectId)
    setSummaryData(
      cloneSummaryData(projectSummaryData as PCRSummaryOfKeyDataType),
    )
    setCurrentTab(0)
  }, [])

  const summaryTableColumnDefs = useMemo<ColDef<ProjectType>[]>(
    () => [
      {
        headerName: 'Project code',
        field: 'code',
        minWidth: 210,
        cellRenderer: (params: ICellRendererParams<ProjectType>) => (
          <div className="flex h-full items-center gap-x-2">
            <IconButton
              aria-label={`View project ${params.data?.code ?? ''}`}
              className="h-7 w-7"
              onClick={() => openDialog(params.data?.id)}
              size="small"
            >
              <FiEye size={16} />
            </IconButton>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {params.value}
            </span>
          </div>
        ),
      },
      ...getSummaryTableColumnDefs(),
    ],
    [openDialog],
  )

  const computedFields = useMemo(
    () => getComputedFields(crtProject, summaryData),
    [crtProject, summaryData],
  )

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

      {crtProject && summaryData && (
        <Dialog
          aria-labelledby="pcr-summary-view-dialog"
          fullWidth={true}
          maxWidth="xl"
          onClose={closeDialog}
          open={true}
          scroll="paper"
        >
          <DialogTitle id="pcr-summary-view-dialog-title">
            Project {crtProject.code}
          </DialogTitle>
          <DialogContent dividers={true}>
            <Tabs
              aria-label="summary-of-key-data-view-tabs"
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
              <Tab id="general" aria-controls="general" label="General" />
              <Tab
                id="alternative-technology"
                aria-controls="alternative-technology"
                label="Alternative technology"
              />
              <Tab
                id="enterprises"
                aria-controls="enterprises"
                label="Enterprises"
              />
              <Tab id="equipment" aria-controls="equipment" label="Equipment" />
            </Tabs>
            <div className="flex flex-col gap-y-6 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
              {currentTab === 0 && (
                <FieldGroup>
                  <div className="flex flex-wrap gap-x-7 gap-y-4">
                    {numberDetailItem(
                      'Funds disbursed',
                      (summaryData.funds_disbursed
                        ? String(summaryData.funds_disbursed)
                        : null) as string,
                      'decimal',
                    )}
                    {dateDetailItem(
                      'Planned date of completion',
                      (summaryData.planned_date_of_completion as string) ?? '',
                    )}
                    {numberDetailItem(
                      'Planned duration (months)',
                      String(computedFields.planned_duration),
                      'number',
                    )}
                    {numberDetailItem(
                      'Actual duration (months)',
                      String(computedFields.actual_duration),
                      'number',
                    )}
                    {numberDetailItem(
                      'Delay (months)',
                      String(computedFields.delay),
                      'number',
                    )}
                  </div>
                </FieldGroup>
              )}

              {currentTab === 1 && (
                <FieldGroup title="Alternative technology">
                  {summaryData.alternative_technologies.length > 0 ? (
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
                        (entry, index) => {
                          const substanceFromValue = getValueToDisplay(
                            substanceOptions,
                            entry.substance_from,
                          )
                          const substanceToValue = getValueToDisplay(
                            substanceOptions,
                            entry.substance_to,
                          )

                          return (
                            <div
                              key={index}
                              className="flex flex-wrap items-end gap-x-7 gap-y-4"
                            >
                              <div className="min-w-56 sm:min-w-64">
                                {detailItem('', substanceFromValue)}
                              </div>
                              <div className="min-w-56 sm:min-w-64">
                                {detailItem('', substanceToValue)}
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </FieldGroup>
              )}

              {currentTab === 2 && (
                <FieldGroup title="Enterprises">
                  {summaryData.enterprises.length > 0 ? (
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
                          {detailItem('', entry.name)}
                          {detailItem('', entry.address, {
                            detailClassname: 'self-start',
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </FieldGroup>
              )}

              {currentTab === 3 && (
                <div>
                  <FieldGroup title="Fate of ODS-BASED PRODUCTION EQUIPMENT - List of equipment rendered unusable(baseline) (optional)">
                    {summaryData.equipments.length > 0 ? (
                      <div className="flex flex-col gap-y-4">
                        <div className="hidden max-w-[84rem] grid-cols-[16rem_22rem_16rem_14rem_auto] gap-4 xl:grid">
                          <Label>Name of equipment</Label>
                          <Label>Description</Label>
                          <Label>Disposal type</Label>
                          <Label>Date of disposal</Label>
                        </div>
                        {summaryData.equipments.map((entry, index) => {
                          const valueToDisplay = getValueToDisplay(
                            disposalTypeOptions,
                            entry.disposal_type,
                          )

                          return (
                            <div
                              key={index}
                              className="grid max-w-[84rem] grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-[16rem_22rem_16rem_14rem_auto]"
                            >
                              <div className="w-full">
                                <div className="xl:hidden">
                                  <Label
                                    htmlFor={`equipment-name-${crtProject.id}-${index}`}
                                  >
                                    Name of equipment
                                  </Label>
                                </div>
                                {detailItem('', entry.name)}
                              </div>
                              <div className="w-full md:col-span-2 xl:col-span-1">
                                <div className="xl:hidden">
                                  <Label
                                    htmlFor={`equipment-description-${crtProject.id}-${index}`}
                                  >
                                    Description
                                  </Label>
                                </div>
                                {detailItem('', entry.description, {
                                  detailClassname: 'self-start',
                                })}
                              </div>
                              <div className="min-w-56 sm:min-w-64">
                                <div className="xl:hidden">
                                  <Label
                                    htmlFor={`equipment-disposal_type-${crtProject.id}-${index}`}
                                  >
                                    Disposal type
                                  </Label>
                                </div>
                                {detailItem('', valueToDisplay)}
                              </div>
                              <div className="w-full">
                                <div className="xl:hidden">
                                  <Label
                                    htmlFor={`equipment-disposal_date-${crtProject.id}-${index}`}
                                  >
                                    Date of disposal
                                  </Label>
                                </div>
                                {dateDetailItem('', entry.disposal_date ?? '')}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </FieldGroup>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PCRSummaryOfKeyData

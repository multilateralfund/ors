import { useCallback, useContext, useMemo, useState } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import Link from '@ors/components/ui/Link/Link'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  ProjectSummary,
  EntryIndex,
  NoDataReported,
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
import { HiArrowLongRight } from 'react-icons/hi2'
import { TfiClose } from 'react-icons/tfi'
import { FiEye } from 'react-icons/fi'
import dayjs from 'dayjs'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Divider,
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

const PCRSummaryOfKeyData = () => {
  const {
    pcr: pcrData,
    pcrMetaproject,
    substanceOptions,
  } = useContext(PCRDataContext)
  const pcr = pcrData.data as PCRResponse

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
      <SectionTitle>Summary of key data</SectionTitle>
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
          PaperProps={{
            sx: {
              backgroundColor: 'var(--color-primary)',
              borderRadius: '8px !important',
              border: 'none !important',
            },
          }}
          fullWidth={true}
          maxWidth="xl"
          onClose={closeDialog}
          open={true}
          scroll="paper"
        >
          <DialogTitle
            id="pcr-summary-view-dialog-title"
            className="px-6 py-5 text-white"
          >
            <div className="flex items-center justify-between gap-4 text-2xl">
              {crtProject.code}
              <Link
                className="flex h-6 w-6 cursor-pointer justify-center"
                href={null}
              >
                <TfiClose size={18} color="white" onClick={closeDialog} />
              </Link>
            </div>
            <ProjectSummary project={crtProject} />
          </DialogTitle>
          <DialogContent className="p-0">
            <Tabs
              aria-label="summary-of-key-data-view-tabs"
              className="sectionsTabs summaryOfKeyDataTabs px-6"
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
            <div className="flex flex-col gap-y-6 bg-white p-6">
              {currentTab === 0 && (
                <FieldGroup>
                  <SubSectionTitle className="!mb-4">Funding</SubSectionTitle>
                  <div className="grid grid-cols-3 gap-x-7 gap-y-4">
                    {numberDetailItem(
                      'Funds approved',
                      (crtProject.funds_approved
                        ? String(crtProject.funds_approved)
                        : null) as string,
                      'decimal',
                    )}
                    {numberDetailItem(
                      'Funds disbursed',
                      (summaryData.funds_disbursed
                        ? String(summaryData.funds_disbursed)
                        : null) as string,
                      'decimal',
                    )}
                  </div>
                  <Divider className="my-5" />
                  <SubSectionTitle className="!mb-4">Schedule</SubSectionTitle>
                  <div className="grid grid-cols-3 gap-x-7 gap-y-4">
                    {dateDetailItem(
                      'Date approved',
                      (crtProject.date_approved as string) ?? '',
                    )}
                    {dateDetailItem(
                      'Planned date of completion',
                      (summaryData.planned_date_of_completion as string) ?? '',
                    )}
                    {dateDetailItem(
                      'Actual date of completion',
                      (crtProject.actual_date_of_completion as string) ?? '',
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-x-7 gap-y-5">
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
                <FieldGroup>
                  {summaryData.alternative_technologies.length > 0 ? (
                    <div className="flex flex-col gap-y-4">
                      <div className="grid grid-cols-2 gap-x-7">
                        <Label className="pl-4">Substance converted from</Label>
                        <Label>Substance converted to</Label>
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
                              className="grid grid-cols-2 gap-x-7 gap-y-4 rounded-lg border border-solid border-[#D8DADE] px-4 py-3"
                            >
                              <div className="flex items-center justify-between">
                                {detailItem('', substanceFromValue)}
                                <HiArrowLongRight
                                  size={40}
                                  className="text-secondary"
                                />
                              </div>
                              {detailItem('', substanceToValue)}
                            </div>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <NoDataReported text="No data reported." />
                  )}
                </FieldGroup>
              )}

              {currentTab === 2 && (
                <FieldGroup>
                  {summaryData.enterprises.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      className="PcrViewTableContainer max-h-[400px]"
                    >
                      <Table stickyHeader className="PcrViewTable">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell className="NameColumn">
                              Name of enterprise
                            </TableCell>
                            <TableCell>Address of enterprise</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summaryData.enterprises.map((row, index) => (
                            <TableRow>
                              <TableCell>
                                <EntryIndex index={index} />
                              </TableCell>

                              <TableCell className="NameColumn w-1/2">
                                {row.name || '-'}
                              </TableCell>

                              <TableCell className="w-1/2">
                                {row.address || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <NoDataReported text="No data reported." />
                  )}
                </FieldGroup>
              )}

              {currentTab === 3 && (
                <FieldGroup title="Fate of ODS-BASED PRODUCTION EQUIPMENT - List of equipment rendered unusable(baseline) (optional)">
                  {summaryData.equipments.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      className="PcrViewTableContainer max-h-[400px]"
                    >
                      <Table stickyHeader className="PcrViewTable">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell className="NameColumn">
                              Name of equipment
                            </TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Disposal type</TableCell>
                            <TableCell>Date of disposal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summaryData.equipments.map((row, index) => {
                            const disposalType = getValueToDisplay(
                              disposalTypeOptions,
                              row.disposal_type,
                            )
                            const disposalDate =
                              row.disposal_date &&
                              dayjs(row.disposal_date).format('DD/MM/YYYY')

                            return (
                              <TableRow>
                                <TableCell>
                                  <EntryIndex index={index} />
                                </TableCell>
                                <TableCell className="NameColumn w-1/4">
                                  {row.name || '-'}
                                </TableCell>
                                <TableCell className="w-1/4">
                                  {row.description || '-'}
                                </TableCell>
                                <TableCell className="w-1/4">
                                  {disposalType || '-'}
                                </TableCell>
                                <TableCell className="w-1/4">
                                  {disposalDate || '-'}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <NoDataReported text="No data reported." />
                  )}
                </FieldGroup>
              )}
            </div>
          </DialogContent>
          <DialogActions className="px-6 py-3">
            <SubmitButton
              title="Cancel"
              onSubmit={closeDialog}
              className="!border-white bg-white !text-primary hover:border-white hover:bg-white hover:text-primary"
            />
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}

export default PCRSummaryOfKeyData

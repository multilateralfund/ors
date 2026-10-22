import { useContext, useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  defaultProps,
  formatClassName,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { TabLabel, PCRTextAreaWidget } from './PCRWidgets'
import {
  EditSectionIndicator,
  EntryIndex,
  UserInfo,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { getSectionAgencies, formatErrors } from '../utils'
import {
  sdgsContributionField,
  sdgsField,
  pcrFieldsMapping,
  borderedContainerClassname,
} from '../constants'

import { IoClose, IoTrash } from 'react-icons/io5'
import { filter, find, map } from 'lodash'
import cx from 'classnames'
import {
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Checkbox,
  Chip,
  Button,
  Radio,
} from '@mui/material'

const PCRSdgs = () => {
  const sectionIdentifier = 'sdgs_contribution'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, sdgsOptions, errors, setErrors } =
    useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const sdgsData = sectionData[crtTab][sdgsField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const sdgsApplying = sectionData[crtTab].sdg_applying

  const { sdgs_contribution: sdgsContributionErrors } = errors
  const sdgsErrors = sdgsContributionErrors[sdgsContributionField]

  const agencyErrors = map(sdgsErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({
    [sdgsContributionField]: agencyErrors,
  })

  const onAddSdg = (sdgId: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialSdgsData = { goal_id: sdgId, description: '' }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [sdgsField]: [...data[sdgsField], initialSdgsData],
              }
            : data,
        ),
      }
    }, sdgsField)
  }

  const onRemoveSdg = (sdgId: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [sdgsField]: data[sdgsField].filter(
                  (sdg) => sdg.goal_id !== sdgId,
                ),
              }
            : data,
        ),
      }
    }, sdgsField)

    setErrors((prevData: Record<string, any[]>) => {
      const pcrSdgs = PCRData.sdgs_contribution || []
      const filteredSdgs = filter(pcrSdgs, (sdg) => sdg.goals.length > 0)

      const crtAgencyIndex = filteredSdgs.findIndex(
        (entry) => entry.agency_id === crtAgencyId,
      )

      const updatedErrors = map(
        prevData[sdgsContributionField],
        (entry, index) =>
          index === crtAgencyIndex
            ? {
                ...entry,
                goals: filter(entry.goals, (goal) => goal.goal_id !== sdgId),
              }
            : entry,
      )

      const crtAgency = pcrSdgs.find((entry) => entry.agency_id === crtAgencyId)

      return {
        ...prevData,
        [sdgsContributionField]:
          crtAgency?.goals?.length === 1
            ? updatedErrors.filter((_, index) => index !== crtAgencyIndex)
            : updatedErrors,
      }
    })
  }

  const handleChangeSdgApplying = (value: boolean) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      sectionData[crtTab] = { ...sectionData[crtTab], sdg_applying: value }

      return { ...prevData, sectionIdentifier: sectionData }
    }, 'sdg_applying')
  }

  const buttonStyle = (value: boolean) => ({
    px: 1.5,
    py: 0.25,
    gap: '7px',
    fontSize: '16px',
    border: '1px solid',
    borderRadius: '20px !important',
    textTransform: 'none !important',
    color: sdgsApplying === value ? '#FFF' : 'var(--color-primary)',
    backgroundColor: sdgsApplying === value ? 'var(--color-primary)' : '#FFF',
    borderColor: sdgsApplying === value ? 'var(--color-primary)' : '#e5e7eb',
    '&:hover': {
      backgroundColor: `${sdgsApplying === value ? 'var(--color-primary)' : '#FFF'} !important`,
      color: `${sdgsApplying === value ? '#FFF' : 'var(--color-primary)'} !important`,
    },
  })

  const SelectedRadioIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8" fill="#DFFF00" />
      <circle cx="9" cy="9" r="3" fill="#092D3A" />
    </svg>
  )

  const UnselectedRadioIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle
        cx="9"
        cy="9"
        r="7.5"
        fill="white"
        stroke="#94A3B8"
        strokeWidth="1.2"
      />
    </svg>
  )

  return (
    <>
      <div className="flex gap-2">
        <Tabs
          aria-label="sdgs-tabs"
          className="sectionsTabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          value={crtTab}
          onChange={(_, newValue) => {
            setCrtTab(newValue)
          }}
        >
          {map(crtAgencies, (agency) => (
            <Tab
              key={agency.name}
              aria-controls={agency.name}
              id={agency.name}
              label={
                <TabLabel
                  field={sdgsContributionField}
                  errors={sdgsErrors}
                  {...{ agency }}
                />
              }
            />
          ))}
        </Tabs>
        <EditSectionIndicator />
      </div>
      <div className="border-0 border-t border-solid border-primary pt-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div
          className={cx(
            'flex flex-col bg-white p-6',
            borderedContainerClassname,
          )}
        >
          <span className="text-lg font-semibold text-primary">
            {pcrFieldsMapping.sdg_applying}
          </span>
          <div className="mt-1.5 flex items-center gap-3">
            <Button
              className="mt-1"
              sx={buttonStyle(true)}
              onClick={() => handleChangeSdgApplying(true)}
            >
              <Radio
                checked={sectionData[crtTab].sdg_applying}
                checkedIcon={<SelectedRadioIcon />}
                icon={<UnselectedRadioIcon />}
                sx={{ p: 0 }}
              />
              Yes
            </Button>
            <UserInfo
              info="If yes, select the SDGs below from the drop-down list (multiple selection allowed) and describe the contribution of the project to each selected SDG."
              placement="bottom"
            />
            <Button
              className="mt-1"
              sx={buttonStyle(false)}
              onClick={() => handleChangeSdgApplying(false)}
            >
              <Radio
                checked={!sectionData[crtTab].sdg_applying}
                checkedIcon={<SelectedRadioIcon />}
                icon={<UnselectedRadioIcon />}
                sx={{ p: 0 }}
              />
              No
            </Button>
          </div>
          {sdgsApplying ? (
            <>
              <Divider className="my-5" />
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-lg font-semibold text-primary">
                  SDGs MLF –
                </span>
                <span className="pt-0.5 leading-none">
                  select from the drop-down list (multiple selection allowed)
                </span>
              </div>
              <Field
                widget="autocomplete"
                multiple
                options={sdgsOptions}
                value={sdgsOptions.filter((option) =>
                  sdgsData.some((sdg) => sdg.goal_id === option.id),
                )}
                onChange={(_, __, reason, details) => {
                  if (reason === 'clear') {
                    sdgsData.forEach((sdg) => onRemoveSdg(Number(sdg.goal_id)))
                    return
                  }

                  const sdgId = details?.option?.id

                  if (!sdgId) return

                  if (reason === 'selectOption') {
                    onAddSdg(Number(sdgId))
                  }

                  if (reason === 'removeOption') {
                    onRemoveSdg(Number(sdgId))
                  }
                }}
                getOptionLabel={(option) => getOptionLabel(sdgsOptions, option)}
                renderOption={(props, option, { selected }) => (
                  <li
                    {...props}
                    key={option.id}
                    className={cx(props.className, 'px-0.5 py-0')}
                  >
                    <Checkbox
                      checked={selected}
                      size="small"
                      sx={{
                        '&.MuiCheckbox-root:not(.Mui-checked)': {
                          color: 'var(--color-gray-400)',
                        },
                      }}
                    />
                    <span
                      className={cx('pt-0.5 leading-none', {
                        'font-semibold text-primary': selected,
                      })}
                    >
                      {option.name}
                    </span>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name.split(':')[0]}
                      deleteIcon={<IoClose size={16} />}
                      sx={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        borderRadius: '9999px !important',
                        textTransform: 'none !important',
                        '&:hover': { color: '#fff !important' },
                        '& .MuiChip-deleteIcon': {
                          color: 'var(--color-mlfs-hlYellow)',
                          '&:hover': { color: 'var(--color-mlfs-hlYellow)' },
                        },
                      }}
                    />
                  ))
                }
                {...defaultProps}
                {...formatClassName('min-w-[300px] md:min-w-[800px]')}
              />
              {sdgsData.length > 0 && (
                <TableContainer
                  component={Paper}
                  className="PcrViewTableContainer mt-5"
                >
                  <Table stickyHeader className="PcrViewTable">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>{pcrFieldsMapping.goal_id}</TableCell>
                        <TableCell>
                          {pcrFieldsMapping.description} of contribution
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {map(sdgsData, (sdg, sdgIndex) => {
                        const crtSdgId = sdg.goal_id
                        const crtSdgName =
                          find(sdgsOptions, (sdg) => sdg.id === crtSdgId)
                            ?.name ?? '-'

                        return (
                          <TableRow key={sdgIndex}>
                            <TableCell>
                              <EntryIndex index={sdgIndex} />
                            </TableCell>
                            <TableCell className="NameColumn w-1/3">
                              {crtSdgName}
                            </TableCell>
                            <TableCell className="w-2/3">
                              <PCRTextAreaWidget
                                {...{ PCRData, setPCRData, sectionIdentifier }}
                                field="description"
                                errors={agencyErrors}
                                indexes={[crtTab, sdgIndex]}
                                subFields={['', sdgsField]}
                                placeholder="Describe the project’s contribution to this SDG…"
                              />
                            </TableCell>
                            <TableCell className="w-[4%] text-center align-middle">
                              <IoTrash
                                className="mx-auto min-h-6 min-w-6 cursor-pointer fill-[#8a2323]"
                                size={16}
                                onClick={() => {
                                  if (!!crtSdgId) {
                                    onRemoveSdg(crtSdgId)
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <PCRTextAreaWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="sdg_not_applying_explanation"
              errors={agencyErrors}
              indexes={[crtTab]}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default PCRSdgs

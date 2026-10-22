import { useContext, useState } from 'react'

import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  EditSectionIndicator,
  EntryIndex,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'
import {
  ppField,
  pcrFieldsMapping,
  projectPhaseOptions,
  filtersBooleanFieldsOpts,
  borderedContainerClassname,
} from '../constants'

import { IoTrash } from 'react-icons/io5'
import { filter, map } from 'lodash'
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
} from '@mui/material'

const PCRGenderMainstreaming = () => {
  const sectionIdentifier = 'gender_mainstreaming'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, errors, setErrors } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const ppData = sectionData[crtTab][ppField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { gender_mainstreaming: genderMainstreamingErrors } = errors
  const ppErrors = genderMainstreamingErrors[ppField]

  const agencyErrors = map(ppErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({ [ppField]: agencyErrors })

  const onAddProjectPhase = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialProjectPhaseData = {
        project_preparation: '',
        prefilled: '',
        qualitative_description: '',
      }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [ppField]: [...data[ppField], initialProjectPhaseData],
              }
            : data,
        ),
      }
    }, ppField)
  }

  const onRemoveProjectPhase = (ppIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [ppField]: data[ppField].filter(
                  (_, crtPpIndex) => crtPpIndex !== ppIndex,
                ),
              }
            : data,
        ),
      }
    }, ppField)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        ppField,
        crtAgencyId,
        ppIndex,
      )

      return {
        ...prevData,
        [ppField]: filter(
          prevData[ppField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Tabs
          aria-label="gender-mainstreaming-tabs"
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
                <TabLabel field={ppField} errors={ppErrors} {...{ agency }} />
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
          {ppData.length > 0 && (
            <TableContainer component={Paper} className="PcrViewTableContainer">
              <Table stickyHeader className="PcrViewTable">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>
                      {pcrFieldsMapping.project_preparation}
                    </TableCell>
                    <TableCell>{pcrFieldsMapping.prefilled}</TableCell>
                    <TableCell>
                      {pcrFieldsMapping.qualitative_description}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {map(ppData, (_, ppIndex) => (
                    <TableRow key={ppIndex}>
                      <TableCell className="w-[4%]">
                        <EntryIndex index={ppIndex} />
                      </TableCell>
                      <TableCell className="w-[18%]">
                        <PCRSelectWidget
                          {...{ PCRData, setPCRData, sectionIdentifier }}
                          field="project_preparation"
                          options={projectPhaseOptions}
                          errors={agencyErrors}
                          indexes={[crtTab, ppIndex]}
                          subFields={['', ppField]}
                          excludeLabel={true}
                        />
                      </TableCell>
                      <TableCell className="w-[12%]">
                        <PCRSelectWidget
                          {...{ PCRData, setPCRData, sectionIdentifier }}
                          field="prefilled"
                          options={filtersBooleanFieldsOpts}
                          errors={agencyErrors}
                          indexes={[crtTab, ppIndex]}
                          subFields={['', ppField]}
                          excludeLabel={true}
                        />
                      </TableCell>
                      <TableCell className="w-[62%]">
                        <PCRTextAreaWidget
                          {...{ PCRData, setPCRData, sectionIdentifier }}
                          field="qualitative_description"
                          errors={agencyErrors}
                          indexes={[crtTab, ppIndex]}
                          subFields={['', ppField]}
                          placeholder=" Describe how this phase met the gender mainstreaming indicators ... "
                          excludeLabel={true}
                          rows={2}
                        />
                      </TableCell>
                      <TableCell className="w-[4%] text-center align-middle">
                        <IoTrash
                          className="mx-auto min-h-6 min-w-6 cursor-pointer fill-[#8a2323]"
                          size={16}
                          onClick={() => {
                            onRemoveProjectPhase(ppIndex)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <SubmitButton
            title="+ Add project cycle phase"
            onSubmit={onAddProjectPhase}
            className={cx(
              'mr-auto h-10 !border-primary !bg-primary !font-normal !text-mlfs-hlYellow',
              { 'mt-4': ppData.length > 0 },
            )}
          />
        </div>
      </div>
    </>
  )
}

export default PCRGenderMainstreaming

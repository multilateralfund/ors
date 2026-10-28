import { useContext, useState } from 'react'

import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { EditSectionIndicator, AddEntityButton } from './EditHelperComponents'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { EntryIndex } from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'
import {
  ppField,
  pcrFieldsMapping,
  projectPhaseOptions,
  booleanFieldsOpts,
  borderedContainerClassname,
} from '../constants'

import { TableCell, TableRow } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { filter, map } from 'lodash'
import * as mui from '@mui/material'
import cx from 'classnames'

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
        <mui.Tabs
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
            <mui.Tab
              key={agency.name}
              aria-controls={agency.name}
              id={agency.name}
              label={
                <TabLabel field={ppField} errors={ppErrors} {...{ agency }} />
              }
            />
          ))}
        </mui.Tabs>
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
            <mui.TableContainer
              component={mui.Paper}
              className="PcrViewTableContainer"
            >
              <mui.Table stickyHeader className="PcrViewTable">
                <mui.TableHead>
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
                </mui.TableHead>
                <mui.TableBody>
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
                          options={booleanFieldsOpts}
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
                      <TableCell className="w-[4%] text-center">
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
                </mui.TableBody>
              </mui.Table>
            </mui.TableContainer>
          )}
          <AddEntityButton
            title="Add project cycle phase"
            action={onAddProjectPhase}
            nrEntities={ppData.length}
          />
        </div>
      </div>
    </>
  )
}

export default PCRGenderMainstreaming

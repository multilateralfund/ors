import { ChangeEvent } from 'react'

import LinkedBPTableWrapper from './LinkedBPTable'
import { FieldErrorIndicator, NavigationButton } from '../HelperComponents'
import { SectionTitle } from './ProjectsCreate'
import {
  ProjectDataProps,
  ProjectTabSetters,
  BpDataProps,
  ProjectTypeApi,
} from '../interfaces'

import { Checkbox, FormControlLabel } from '@mui/material'
import cx from 'classnames'

const ProjectBPLinking = ({
  projectData,
  setProjectData,
  isSectionDisabled,
  isNextButtonDisabled,
  setCurrentTab,
  bpData,
  onBpDataChange,
  bpErrors,
  project,
}: ProjectDataProps &
  ProjectTabSetters & {
    isSectionDisabled: boolean
    isNextButtonDisabled: boolean
    bpData: BpDataProps
    onBpDataChange: (bpData: BpDataProps) => void
    bpErrors: { [key: string]: string[] }
    project?: ProjectTypeApi
  }) => {
  const { country, agency, cluster } = projectData.projIdentifiers
  const { isLinkedToBP } = projectData.bpLinking

  const handleChangeBPLink = (event: ChangeEvent<HTMLInputElement>) => {
    if (!bpData.hasBpData) {
      setProjectData((prevData) => {
        const { bpLinking } = prevData
        const isChecked = event.target.checked

        return {
          ...prevData,
          bpLinking: {
            ...bpLinking,
            isLinkedToBP: isChecked,
            bpId: isChecked ? bpLinking.bpId : null,
          },
        }
      })
    }
  }

  return (
    <>
      <div
        className={cx({ 'pointer-events-none opacity-50': isSectionDisabled })}
      >
        <div className="flex items-center">
          <SectionTitle>Business Plan</SectionTitle>
          <div className="mb-4">
            <FieldErrorIndicator errors={bpErrors} field="bp_activity" />
          </div>
        </div>
        <FormControlLabel
          label="The proposal is included in a BP"
          control={
            <Checkbox
              checked={isLinkedToBP}
              onChange={handleChangeBPLink}
              size="small"
              inputProps={{ tabIndex: 0 }}
              sx={{
                '&.Mui-focusVisible': {
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                },
                color: 'black',
              }}
            />
          }
          componentsProps={{ typography: { fontSize: '1rem' } }}
        />
        {country && agency && cluster && (
          <LinkedBPTableWrapper
            {...{
              projectData,
              setProjectData,
              bpData,
              onBpDataChange,
              project,
            }}
          />
        )}
      </div>
      <div className="mt-7">
        <NavigationButton
          setCurrentTab={setCurrentTab}
          isBtnDisabled={isNextButtonDisabled}
        />
      </div>
    </>
  )
}

export default ProjectBPLinking

import { useContext, useState } from 'react'

import FileInput from './FileInput'
import {
  FileMetaDataProps,
  ProjectFile,
  ProjectFiles,
  ProjectTabSetters,
  ProjectTypeApi,
} from '../interfaces'
import { NavigationButton } from '../../ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { FilesViewer } from './FilesViewer'

import { Tabs, Tab } from '@mui/material'
import { find, map } from 'lodash'

const PCRDocumentation = ({
  files,
  setFiles,
  projectFiles = [],
  filesMetaData,
  setFilesMetaData,
  mode,
  setCurrentTab,
}: ProjectFiles &
  ProjectTabSetters &
  FileMetaDataProps & {
    projectFiles?: ProjectFile[]
    mode: string
    project?: ProjectTypeApi
    loadedFiles?: boolean
    errors?: Array<{ id: number; message: string } | null>
    allFileErrors?: { message: string }[]
  }) => {
  const { agencies } = useContext(ProjectsDataContext)

  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    files,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  return (
    <>
      <div>
        <Tabs
          aria-label="agency-documentation-tabs"
          className="sectionsTabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          value={crtAgency}
          onChange={(_, newValue) => {
            setCrtAgency(newValue)
          }}
        >
          {crtAgencies.map((agency) => (
            <Tab
              key={agency}
              aria-controls={agency}
              id={agency}
              label={agency}
            />
          ))}
        </Tabs>
        <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
          {crtAgencies
            .filter((_, index) => index === crtAgency)
            .map(() => (
              <div className="flex w-full flex-col gap-4">
                <FilesViewer
                  {...{
                    mode,
                    files,
                    setFiles,
                    filesMetaData,
                    setFilesMetaData,
                    crtAgency,
                  }}
                  PCRFiles={
                    mode === 'edit' || mode === 'view' ? projectFiles : []
                  }
                />

                {mode !== 'view' && (
                  <FileInput
                    {...{
                      files,
                      setFiles,
                      setFilesMetaData,
                      crtAgency,
                    }}
                  />
                )}
              </div>
            ))}
        </div>
      </div>
      {setCurrentTab && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        </div>
      )}
    </>
  )
}

export default PCRDocumentation

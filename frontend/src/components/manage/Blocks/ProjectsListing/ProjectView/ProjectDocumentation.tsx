import { useContext } from 'react'

import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FilesViewer } from './FilesViewer'
import { ProjectFile, ProjectFiles, ProjectTypeApi } from '../interfaces'

const ProjectDocumentation = ({
  files,
  setFiles,
  projectFiles = [],
  mode,
  project,
  loadedFiles,
}: ProjectFiles & {
  projectFiles?: ProjectFile[]
  mode: string
  project?: ProjectTypeApi
  loadedFiles?: boolean
}) => {
  const { canUpdateProjects, canUpdateV3Projects } =
    useContext(PermissionsContext)

  const { version = 0 } = project ?? {}
  const canEditProject =
    (version < 3 && canUpdateProjects) || (version === 3 && canUpdateV3Projects)

  return (
    <div className="flex w-full flex-col gap-4">
      <FilesViewer
        {...{ files, setFiles, mode, project, loadedFiles }}
        bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
      />

      {mode !== 'view' && canEditProject && (
        <FileInput
          {...{ files, setFiles }}
          extensionsList="Allowed files extensions: .pdf, .doc, .docx"
          label="Upload completed template and any supporting documentation"
          value=""
          clearable={false}
          inputValue={[]}
          accept=".pdf,.doc,.docx"
        />
      )}
    </div>
  )
}

export default ProjectDocumentation

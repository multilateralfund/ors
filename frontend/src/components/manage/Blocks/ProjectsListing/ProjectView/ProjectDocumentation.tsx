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
}: ProjectFiles & {
  projectFiles?: ProjectFile[]
  mode: string
  project?: ProjectTypeApi
}) => {
  const { canUpdateProjects, canEditApprovedProjects } =
    useContext(PermissionsContext)
  const canUploadFiles =
    mode !== 'edit' ||
    (mode === 'edit' &&
      ((project?.version ?? 1) < 3 || canEditApprovedProjects))

  return (
    <div className="flex w-full flex-col gap-4">
      <FilesViewer
        {...{ files, setFiles, mode, project }}
        bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
      />

      {mode !== 'view' && canUpdateProjects && canUploadFiles && (
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

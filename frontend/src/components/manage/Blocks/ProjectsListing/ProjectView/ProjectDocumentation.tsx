import { useContext } from 'react'

import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FilesViewer } from './FilesViewer'
import { ProjectFile, ProjectFiles } from '../interfaces'

const ProjectDocumentation = ({
  files,
  setFiles,
  projectFiles = [],
  mode,
}: ProjectFiles & {
  projectFiles?: ProjectFile[]
  mode: string
}) => {
  const { canUpdateProjects } = useContext(PermissionsContext)

  return (
    <div className="flex w-full flex-col gap-4">
      <FilesViewer
        {...{ files, setFiles, mode }}
        bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
      />

      {mode !== 'view' && canUpdateProjects && (
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

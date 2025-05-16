import { Dispatch, SetStateAction } from 'react'

import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { FilesViewer } from '@ors/components/manage/Blocks/BusinessPlans/FilesViewer'
import { ProjectFile, ProjectFilesObject } from '../interfaces'

const ProjectDocumentation = ({
  files,
  setFiles,
  projectFiles,
  mode,
}: {
  files?: ProjectFilesObject
  setFiles?: Dispatch<SetStateAction<ProjectFilesObject>>
  projectFiles: ProjectFile[]
  mode?: string
}) => {
  return (
    <div
      key={JSON.stringify(projectFiles)}
      className="flex w-full flex-col gap-4"
    >
      <FilesViewer {...{ files, setFiles }} bpFiles={projectFiles || []} />
      {mode === 'edit' && (
        <FileInput
          {...{ files, setFiles }}
          extensionsList="Allowed files extensions: .pdf, .doc, .docx"
        />
      )}
    </div>
  )
}

export default ProjectDocumentation

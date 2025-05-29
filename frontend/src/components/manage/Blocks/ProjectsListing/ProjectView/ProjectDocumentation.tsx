import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
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
  return (
    <div
      key={JSON.stringify(projectFiles)}
      className="flex w-full flex-col gap-4"
    >
      <FilesViewer {...{ files, setFiles }} bpFiles={projectFiles || []} />

      {mode !== 'view' && (
        <div className="lg:w-1/2">
          <FileInput
            {...{ files, setFiles }}
            extensionsList="Allowed files extensions: .pdf, .doc, .docx"
            value="Select files"
            clearable={false}
            inputValue={[]}
            accept=".pdf,.doc,.docx"
          />
        </div>
      )}
    </div>
  )
}

export default ProjectDocumentation

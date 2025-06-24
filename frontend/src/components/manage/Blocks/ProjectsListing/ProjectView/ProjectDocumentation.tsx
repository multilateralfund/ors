import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { FilesViewer } from './FilesViewer'
import { ProjectFile, ProjectFiles } from '../interfaces'

const ProjectDocumentation = ({
  projectFiles = [],
  mode,
  isDraftProject,
  ...rest
}: ProjectFiles & {
  projectFiles?: ProjectFile[]
  mode: string
  isDraftProject?: boolean
}) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <FilesViewer
        {...{ mode, isDraftProject }}
        bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
        {...rest}
      />

      {mode !== 'view' && (
        <FileInput
          extensionsList="Allowed files extensions: .pdf, .doc, .docx"
          label="Upload completed template and any supporting documentation"
          value=""
          clearable={false}
          inputValue={[]}
          accept=".pdf,.doc,.docx"
          {...rest}
        />
      )}
    </div>
  )
}

export default ProjectDocumentation

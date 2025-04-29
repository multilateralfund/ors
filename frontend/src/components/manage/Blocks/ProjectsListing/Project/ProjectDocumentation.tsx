import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { FilesViewer } from '@ors/components/manage/Blocks/BusinessPlans/FilesViewer'

const ProjectDocumentation = ({ files, setFiles, projectFiles, mode }: any) => {
  return (
    <div className="flex w-full flex-col gap-4">
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

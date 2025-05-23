import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { FilesViewer } from '@ors/components/manage/Blocks/BusinessPlans/FilesViewer'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { ProjectFile, ProjectFiles } from '../interfaces'

import { TbFiles } from 'react-icons/tb'

const ProjectDocumentation = ({
  files,
  setFiles,
  projectFiles,
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
      {mode !== 'add' ? (
        <FilesViewer {...{ files, setFiles }} bpFiles={projectFiles || []} />
      ) : (
        <HeaderWithIcon title="File attachments" Icon={TbFiles} />
      )}
      {mode !== 'view' && (
        <FileInput
          {...{ files, setFiles }}
          extensionsList="Allowed files extensions: .pdf, .doc, .docx"
        />
      )}
    </div>
  )
}

export default ProjectDocumentation

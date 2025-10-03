import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { NextButton } from '../HelperComponents'
import { FilesViewer } from './FilesViewer'
import {
  ProjectFile,
  ProjectFiles,
  ProjectTabSetters,
  ProjectTypeApi,
} from '../interfaces'

const ProjectDocumentation = ({
  files,
  setFiles,
  projectFiles = [],
  mode,
  project,
  loadedFiles,
  setCurrentStep,
  setCurrentTab,
  hasNextButton,
  nextStep,
}: ProjectFiles &
  ProjectTabSetters & {
    projectFiles?: ProjectFile[]
    mode: string
    hasNextButton?: boolean
    project?: ProjectTypeApi
    loadedFiles?: boolean
    nextStep?: number
  }) => {
  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <FilesViewer
          {...{ files, setFiles, mode, project, loadedFiles }}
          bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
        />

        {mode !== 'view' && (
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
      {setCurrentStep && nextStep && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NextButton
            nextStep={nextStep}
            nextTab={nextStep - 1}
            type="previous"
            setCurrentTab={setCurrentTab}
          />
          {hasNextButton && (
            <NextButton
              nextStep={6}
              setCurrentStep={setCurrentStep}
              setCurrentTab={setCurrentTab}
            />
          )}
        </div>
      )}
    </>
  )
}

export default ProjectDocumentation

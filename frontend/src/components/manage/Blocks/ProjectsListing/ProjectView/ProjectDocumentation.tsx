import FileInput from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/FileInput'
import { NavigationButton } from '../HelperComponents'
import { FilesViewer } from './FilesViewer'
import {
  FileMetaDataProps,
  ProjectFile,
  ProjectFiles,
  ProjectTabSetters,
  ProjectTypeApi,
} from '../interfaces'

const ProjectDocumentation = ({
  projectFiles = [],
  mode,
  project,
  loadedFiles,
  setCurrentTab,
  nextStep,
  hasNextStep,
  isNextButtonDisabled,
  filesMetaData,
  ...rest
}: ProjectFiles &
  ProjectTabSetters &
  FileMetaDataProps & {
    projectFiles?: ProjectFile[]
    mode: string
    project?: ProjectTypeApi
    loadedFiles?: boolean
    nextStep?: number
    hasNextStep?: boolean
    isNextButtonDisabled?: boolean
  }) => {
  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <FilesViewer
          {...{
            mode,
            project,
            loadedFiles,
            filesMetaData,
          }}
          {...rest}
          bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
        />

        {mode !== 'view' && (
          <FileInput
            {...rest}
            extensionsList="Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .png, .jpg, .jpeg, .gif"
            label="Upload completed template and any supporting documentation"
            value=""
            clearable={false}
            inputValue={[]}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
          />
        )}
      </div>
      {setCurrentTab && nextStep && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NavigationButton
            nextTab={nextStep - 1}
            type="previous"
            setCurrentTab={setCurrentTab}
          />
          {hasNextStep && (
            <NavigationButton
              isBtnDisabled={isNextButtonDisabled}
              {...{ setCurrentTab }}
            />
          )}
        </div>
      )}
    </>
  )
}

export default ProjectDocumentation

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
  setCurrentTab,
  nextStep,
  hasNextStep,
  isNextButtonDisabled,
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
    errors?: Array<{ id: number; message: string } | null>
    allFileErrors?: { message: string }[]
  }) => {
  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <FilesViewer
          {...{ mode, ...rest }}
          bpFiles={mode === 'edit' || mode === 'view' ? projectFiles : []}
        />

        {mode !== 'view' && (
          <FileInput
            {...rest}
            extensionsList="Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .png, .jpg, .jpeg, .gif"
            label={
              mode === 'transfer'
                ? 'Upload file attachments'
                : 'Upload completed template and any supporting documentation'
            }
            value=""
            mode={mode}
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

import { useContext, useEffect, useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import ExportConfirmModal from './ExportConfirmModal'
import { defaultProps, exportButtonClassname } from '../constants'
import { ProjectDocs, ProjectFile } from '../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { CircularProgress, Divider } from '@mui/material'
import { filter, isNil, map } from 'lodash'
import { TbFiles } from 'react-icons/tb'
import cx from 'classnames'

export function FilesViewer(props: ProjectDocs) {
  const {
    bpFiles,
    files,
    setFiles,
    mode,
    project,
    loadedFiles,
    filesMetaData,
    setFilesMetaData,
  } = props

  const { fileTypes } = useContext(ProjectsDataContext)
  const fileTypesOpts = map(fileTypes, (type) => ({
    id: type[0],
    name: type[1],
  }))

  const firstColFieldsProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full',
    },
  }

  const [currentFiles, setCurrentFiles] = useState<(ProjectFile | File)[]>([])
  const [exportConfirmModalType, setExportConfirmModalType] = useState<
    string | null
  >(null)

  useEffect(() => {
    const existingFiles = filter(
      bpFiles,
      (file) => !files?.deletedFilesIds?.includes(file.id),
    )

    const newFiles = files?.newFiles || []

    setCurrentFiles([...existingFiles, ...newFiles])
  }, [bpFiles, files])

  const handleDelete = (file: ProjectFile | File, fileIndex: number) => {
    const isNewFile = !(file as ProjectFile).id
    const updatedFiles = filter(currentFiles, (crtFile) =>
      isNewFile
        ? crtFile !== file
        : (crtFile as ProjectFile).id !== (file as ProjectFile).id,
    )

    setCurrentFiles(updatedFiles)

    setFiles?.({
      ...files,
      newFiles: isNewFile
        ? files?.newFiles?.filter((f) => f !== file)
        : files?.newFiles || [],
      deletedFilesIds: isNewFile
        ? files?.deletedFilesIds || []
        : [...(files?.deletedFilesIds || []), (file as ProjectFile).id],
    })

    setFilesMetaData?.((prev) =>
      filter(prev, (_, index: number) => fileIndex !== index),
    )
  }

  const handleChangeFileType = (value: any, fileIndex: number) => {
    setFilesMetaData?.((prev) =>
      map(prev, (file, index: number) =>
        fileIndex === index ? { ...file, type: value?.id ?? null } : file,
      ),
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <HeaderWithIcon title="File attachments" Icon={TbFiles} />
        {mode === 'edit' && (
          <>
            <div className="mt-5 flex gap-4">
              {['Draft', 'Submitted', 'Recommended'].includes(
                project?.submission_status ?? '',
              ) && (
                <>
                  <a
                    className={cx(
                      exportButtonClassname,
                      'h-9 border-white hover:border-mlfs-hlYellow hover:text-mlfs-hlYellow',
                    )}
                    onClick={() => {
                      setExportConfirmModalType('word-export')
                    }}
                  >
                    Download project template
                  </a>
                  <a
                    className={cx(
                      exportButtonClassname,
                      'h-9 border-white hover:border-mlfs-hlYellow hover:text-mlfs-hlYellow',
                    )}
                    onClick={() => {
                      setExportConfirmModalType('excel-export')
                    }}
                  >
                    Download Excel
                  </a>
                </>
              )}
              <a
                href="https://www.multilateralfund.org/resources/project-guides-tools"
                rel="noopener noreferrer nofollow"
                target="_blank"
                className={cx(
                  'h-9 border-white bg-secondary',
                  exportButtonClassname,
                )}
              >
                Guides and Tools
              </a>
            </div>
            <Divider className="mt-4" />
          </>
        )}

        {!isNil(loadedFiles) && !loadedFiles ? (
          <CircularProgress color="inherit" size="30px" className="mt-2" />
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {currentFiles.length === 0 ? (
              <p className="m-1 ml-0 text-lg font-normal text-gray-500">
                No files available
              </p>
            ) : (
              currentFiles.map((file, index: number) => {
                const isFileEditable =
                  setFiles && ('editable' in file ? file.editable : true)
                const fileName = (file as ProjectFile).filename || file.name
                const downloadUrl = (file as ProjectFile).download_url

                return (
                  <div key={index} className="flex items-center gap-2">
                    <a
                      className="m-0 flex items-center gap-2.5 no-underline"
                      href={
                        downloadUrl
                          ? formatApiUrl(downloadUrl)
                          : URL.createObjectURL(file as File)
                      }
                      {...(!downloadUrl && {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      })}
                      download={fileName}
                    >
                      <IoDownloadOutline className="mb-1 min-h-[20px] min-w-[20px] text-secondary" />
                      <span className="text-lg font-medium text-secondary">
                        {fileName}
                      </span>
                    </a>
                    {filesMetaData && setFilesMetaData && (
                      <div className="w-64">
                        <Label>Type</Label>
                        <div className="flex items-center">
                          <Field
                            widget="autocomplete"
                            options={fileTypesOpts}
                            value={filesMetaData[index]?.type}
                            onChange={(_, value) =>
                              handleChangeFileType(value, index)
                            }
                            getOptionLabel={(option) =>
                              getOptionLabel(fileTypesOpts, option)
                            }
                            disabled={!isFileEditable}
                            // Input={{
                            //   error: getIsInputDisabled('country'),
                            // }}
                            {...firstColFieldsProps}
                          />
                          {/* <FieldErrorIndicator errors={errors} field="country" /> */}
                        </div>
                      </div>
                    )}
                    {isFileEditable && (
                      <IoTrash
                        className="transition-colors mb-1 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
                        onClick={() => handleDelete(file, index)}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
      {!!exportConfirmModalType && (
        <ExportConfirmModal
          mode={exportConfirmModalType}
          projectId={project?.id}
          setModalType={setExportConfirmModalType}
        />
      )}
    </>
  )
}

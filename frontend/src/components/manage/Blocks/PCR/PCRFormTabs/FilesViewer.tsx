import { useContext, useEffect, useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { PCRDocs } from '../interfaces'
import { formatApiUrl } from '@ors/helpers'
import { FieldErrorIndicator } from '../../ProjectsListing/HelperComponents'
import { defaultProps } from '../../ProjectsListing/constants'
import { ProjectFile } from '../../ProjectsListing/interfaces'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { filter, find, isNil, map } from 'lodash'
import { CircularProgress } from '@mui/material'
import { TbFiles } from 'react-icons/tb'
import cx from 'classnames'

export function FilesViewer({
  PCRFiles = [],
  files = [],
  setFiles,
  mode,
  loadedFiles,
  filesMetaData,
  setFilesMetaData,
  errors,
  crtAgency,
}: PCRDocs) {
  const { fileTypes } = useContext(ProjectsDataContext)
  const fileTypesOpts = map(fileTypes, ([id, name]) => ({ id, name }))

  const filesProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full ProjAssociation',
    },
  }

  const [currentFiles, setCurrentFiles] = useState<(ProjectFile | File)[]>([])

  const { addUpdatedField } = useUpdatedFields()

  console.log(filesMetaData)
  useEffect(() => {
    const existingFiles = filter(
      PCRFiles[crtAgency],
      (file) => !files[crtAgency]?.deletedFilesIds?.includes(file.id),
    )

    const newFiles = files[crtAgency]?.newFiles || []

    setCurrentFiles([...existingFiles, ...newFiles])
  }, [PCRFiles, files])

  const handleDelete = (file: ProjectFile | File, fileIndex: number) => {
    addUpdatedField('files')

    const isNewFile = !(file as ProjectFile).id
    const updatedFiles = filter(currentFiles, (crtFile) =>
      isNewFile
        ? crtFile !== file
        : (crtFile as ProjectFile).id !== (file as ProjectFile).id,
    )

    setCurrentFiles(updatedFiles)

    const newFilesUpdated = map(files, (fileEntry, index) =>
      crtAgency === index
        ? {
            ...fileEntry,
            newFiles: isNewFile
              ? files[crtAgency]?.newFiles?.filter((f) => f !== file)
              : files[crtAgency]?.newFiles || [],
            deletedFilesIds: isNewFile
              ? files[crtAgency]?.deletedFilesIds || []
              : [
                  ...(files[crtAgency]?.deletedFilesIds || []),
                  (file as ProjectFile).id,
                ],
          }
        : fileEntry,
    )
    setFiles?.(newFilesUpdated)

    setFilesMetaData?.((prev) =>
      prev.map((agency, index) =>
        index === crtAgency
          ? {
              ...agency,
              filesMetaData: filter(
                agency.filesMetaData,
                (_, index: number) => fileIndex !== index,
              ),
            }
          : agency,
      ),
    )
  }

  const handleChangeFileType = (value: any, fileIndex: number) => {
    addUpdatedField('files')

    setFilesMetaData?.((prev) =>
      prev.map((agency, index) =>
        index === crtAgency
          ? {
              ...agency,
              filesMetaData: map(agency.filesMetaData, (file, index: number) =>
                fileIndex === index
                  ? { ...file, type: value?.id ?? null }
                  : file,
              ),
            }
          : agency,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <HeaderWithIcon title="File attachments" Icon={TbFiles} />
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
                <div
                  key={index}
                  className={cx('flex flex-wrap items-end gap-2', {
                    'gap-x-4': mode !== 'view',
                  })}
                >
                  <a
                    className="m-0 mb-1 flex items-center gap-2.5 no-underline"
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
                  {filesMetaData ? (
                    <div className="flex-shrink basis-[290px]">
                      <Label className="!mb-0.5 !text-[15px]">Type</Label>
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
                          {...filesProps}
                        />
                        <FieldErrorIndicator
                          errors={{
                            file: filter(
                              errors,
                              (error) => error?.id === index,
                            ).map(
                              (error) => error?.message.split(' - ')[1] || '',
                            ),
                          }}
                          field="file"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-1 text-lg italic">
                      {find(fileTypes, (type) => type[0] === file.type)?.[1] ??
                        ''}
                    </div>
                  )}
                  {isFileEditable && (
                    <IoTrash
                      className="transition-colors mb-1.5 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
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
  )
}

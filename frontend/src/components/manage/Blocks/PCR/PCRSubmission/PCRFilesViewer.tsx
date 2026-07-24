import { useContext, useEffect, useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { defaultProps } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { ProjectFile } from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { TbFiles } from 'react-icons/tb'
import { filter, map } from 'lodash'

const PCRFilesViewer = ({ crtTab }: { crtTab: number }) => {
  const { files, setFiles, filesMetadata, setFilesMetadata } =
    useContext(PCRDataContext)
  const { fileSectionOptions } = useContext(PCRDataContext)

  const { addUpdatedField } = useUpdatedFields()

  const [allFiles, setAllFiles] = useState<(ProjectFile | File)[]>([])

  useEffect(() => {
    const newFiles = files[crtTab].newFiles || []

    setAllFiles([...newFiles])
  }, [files])

  const fileFieldProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full ProjAssociation',
    },
  }

  const handleChangeFileSection = (value: any, fileIndex: number) => {
    const updatedFilesMetadata = map(
      filesMetadata,
      (metadata, metadataIndex) => {
        const updatedMetadata = map(metadata.filesMetadata, (data, index) =>
          fileIndex === index ? { ...data, section: value?.id ?? null } : data,
        )

        return metadataIndex === crtTab
          ? { ...metadata, filesMetadata: updatedMetadata }
          : metadata
      },
    )
    setFilesMetadata(updatedFilesMetadata)

    addUpdatedField('files')
  }

  const handleDeleteFile = (file: ProjectFile | File, fileIndex: number) => {
    const isNewFile = !(file as ProjectFile).id

    const updatedAllFiles = filter(allFiles, (crtFile) =>
      isNewFile
        ? crtFile !== file
        : (crtFile as ProjectFile).id !== (file as ProjectFile).id,
    )

    setAllFiles(updatedAllFiles)

    const updatedFiles = map(files, (fileEntry, fileIndex) => {
      const agencyNewFiles = files[crtTab].newFiles || []
      const agencyDeletedFilesIds = files[crtTab].deletedFilesIds || []

      const newFiles = isNewFile
        ? agencyNewFiles.filter((f) => f !== file)
        : agencyNewFiles

      const deletedFilesIds = isNewFile
        ? agencyDeletedFilesIds
        : [...agencyDeletedFilesIds, (file as ProjectFile).id]

      return crtTab === fileIndex
        ? { ...fileEntry, newFiles, deletedFilesIds }
        : fileEntry
    })
    setFiles(updatedFiles)

    const updatedFilesMetadata = map(
      filesMetadata,
      (metadata, metadataIndex) =>
        metadataIndex === crtTab
          ? {
              ...metadata,
              filesMetadata: filter(
                metadata.filesMetadata,
                (_, index) => fileIndex !== index,
              ),
            }
          : metadata,
    )
    setFilesMetadata(updatedFilesMetadata)

    addUpdatedField('files')
  }

  return (
    <div>
      <HeaderWithIcon title="File attachments" Icon={TbFiles} />
      <div className="mt-3">
        {allFiles.length === 0 ? (
          <p className="m-1 ml-0 text-lg text-gray-500">No files available</p>
        ) : (
          allFiles.map((file, index) => {
            const fileName = (file as ProjectFile).filename || file.name
            const downloadUrl = (file as ProjectFile).download_url

            const agencyFileMetadata = filesMetadata[crtTab].filesMetadata
            const value = agencyFileMetadata[index].section

            return (
              <div
                key={index}
                className="flex flex-wrap items-end gap-x-4 gap-y-2"
              >
                <a
                  className="mb-1 flex gap-2.5 text-secondary no-underline"
                  download={fileName}
                  href={
                    downloadUrl
                      ? formatApiUrl(downloadUrl)
                      : URL.createObjectURL(file as File)
                  }
                  {...(!downloadUrl && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  <IoDownloadOutline className="mb-1 min-h-5 min-w-5" />
                  <span className="text-lg font-medium">{fileName}</span>
                </a>
                <div className="flex-shrink basis-[290px]">
                  <Label className="!mb-0.5 !text-[15px]">Section</Label>
                  <div className="flex items-center">
                    <Field
                      widget="autocomplete"
                      options={fileSectionOptions}
                      value={value}
                      onChange={(_, value) =>
                        handleChangeFileSection(value, index)
                      }
                      getOptionLabel={(option) =>
                        getOptionLabel(fileSectionOptions, option)
                      }
                      {...fileFieldProps}
                    />
                  </div>
                </div>
                <IoTrash
                  className="mb-1.5 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  onClick={() => handleDeleteFile(file, index)}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PCRFilesViewer

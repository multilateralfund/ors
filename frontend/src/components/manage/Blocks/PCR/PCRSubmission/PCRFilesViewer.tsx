import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { defaultProps } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { TbFiles } from 'react-icons/tb'

const PCRFilesViewer = ({ crtTab }: { crtTab: number }) => {
  const sectionIdentifier = 'supporting_evidences'
  const evidencesField = 'evidences'

  const { PCRData, setPCRData, fileSectionOptions } = useContext(PCRDataContext)

  const sectionData = PCRData[sectionIdentifier] || []
  const evidencesData = sectionData[crtTab][evidencesField] || []

  const fileFieldProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full ProjAssociation',
    },
  }

  const handleChangeFileSection = (value: any, fileIndex: number) => {
    const formattedVal = value?.id ?? null

    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [evidencesField]: data[evidencesField].map(
                  (evidence, evidenceIndex) =>
                    evidenceIndex === fileIndex
                      ? { ...evidence, section_id: formattedVal }
                      : evidence,
                ),
              }
            : data,
        ),
      }
    }, evidencesField)
  }

  const handleDeleteFile = (fileIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [evidencesField]: data[evidencesField].filter(
                  (_, crtFileIndex) => crtFileIndex !== fileIndex,
                ),
              }
            : data,
        ),
      }
    }, evidencesField)
  }

  return (
    <div>
      <HeaderWithIcon title="File attachments" Icon={TbFiles} />
      <div className="mt-3">
        {evidencesData.length === 0 ? (
          <p className="m-1 ml-0 text-lg text-gray-500">No files available</p>
        ) : (
          evidencesData.map((file, index) => {
            const fileName = file.filename
            const downloadUrl = file.link

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
                      : URL.createObjectURL(file.file)
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
                      value={file.section_id}
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
                  onClick={() => handleDeleteFile(index)}
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

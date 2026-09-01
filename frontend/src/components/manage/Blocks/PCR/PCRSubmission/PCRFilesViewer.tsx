import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { defaultProps } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { formatErrors } from './PCRWidgets'
import { getErrorIndex } from '../utils'
import {
  pcrFieldsMapping,
  supportingEvidencesField,
  evidencesField,
} from '../constants'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { TbFiles } from 'react-icons/tb'
import { filter } from 'lodash'

const PCRFilesViewer = ({
  crtTab,
  crtAgencyId,
  errors,
}: {
  crtTab: number
  crtAgencyId: number
  errors: Record<string, any>
}) => {
  const { PCRData, setPCRData, setErrors, fileSectionOptions } =
    useContext(PCRDataContext)

  const sectionData = PCRData[supportingEvidencesField] || []
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
      const sectionData = prevData[supportingEvidencesField] || []

      return {
        ...prevData,
        [supportingEvidencesField]: sectionData.map((data, dataIndex) =>
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
      const sectionData = prevData[supportingEvidencesField] || []

      return {
        ...prevData,
        [supportingEvidencesField]: sectionData.map((data, dataIndex) =>
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

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        evidencesField,
        crtAgencyId,
        fileIndex,
      )

      return {
        ...prevData,
        [supportingEvidencesField]: filter(
          prevData[supportingEvidencesField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
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

            const formattedErrors = formatErrors(errors, [index])

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
                  <Label className="!mb-0.5 !text-[15px]">
                    {pcrFieldsMapping.section_id}
                  </Label>
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
                    <FieldErrorIndicator
                      errors={formattedErrors}
                      field="section_id"
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

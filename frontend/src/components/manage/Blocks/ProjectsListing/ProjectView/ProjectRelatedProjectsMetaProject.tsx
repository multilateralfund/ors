import { useCallback, useContext } from 'react'

import Link from '@ors/components/ui/Link/Link.tsx'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { orderFieldData } from '../UpdateMyaData/MetaProjectEdit'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { getFormattedDecimalValue, getFormattedNumericValue } from '../utils'
import { nonMonetaryFields } from '../UpdateMyaData/constants'
import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '../UpdateMyaData/types'

import { CircularProgress, Divider } from '@mui/material'
import { MdOutlineManageSearch } from 'react-icons/md'
import dayjs from 'dayjs'

const ProjectRelatedProjectsMetaProject = ({
  metaprojectData,
}: {
  metaprojectData?: MetaProjectDetailType | null
}) => {
  const { canViewMetaProjects } = useContext(PermissionsContext)

  const metadatDisplayClassname =
    'grid w-full grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2'

  const formatMetaprojectData = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = metaprojectData?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      const fdEntry = fd[key as keyof MetaProjectFieldData]
      result[key] =
        fdEntry.type === 'DecimalField'
          ? getFormattedDecimalValue(fdEntry.value as string)
          : fdEntry.value
    }

    return result
  }, [metaprojectData])

  const mpData = formatMetaprojectData()

  const fieldData = orderFieldData(metaprojectData?.field_data ?? {})

  const getFieldValue = (name: string) => {
    const fieldValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data[name]
    const value = fieldValue === null ? computedValue : fieldValue
    return value || ''
  }

  const valueIsComputed = (name: string) => {
    const fieldValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data[name]

    return fieldValue === null && computedValue !== undefined
  }

  const getFormattedFieldValue = (fd: any) => {
    const fieldValue = getFieldValue(fd.name)

    switch (fd.type) {
      case 'DateTimeField':
        return (fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || 'N/A'
      case 'DecimalField':
        return fieldValue
          ? `${nonMonetaryFields.includes(fd.name) ? '' : '$'}${getFormattedNumericValue(fieldValue, 2)}`
          : 'N/A'
      default:
        return fieldValue ? getFormattedNumericValue(fieldValue, 0) : 'N/A'
    }
  }

  const renderFieldData = (fieldData: any) =>
    fieldData.map((fd: any) => {
      const isComputed = valueIsComputed(fd.name)

      return (
        <div key={fd.name} className="py-2">
          <Label className="!mb-0.5" htmlFor={fd.name}>
            {fd.label}
          </Label>
          <span className="flex gap-2.5">
            <h4 className="m-0">{getFormattedFieldValue(fd)}</h4>
            {isComputed ? (
              <span
                className="rounded-lg bg-white px-1 pt-[1px] text-sm font-medium uppercase text-[#888]"
                title="Based on contained projects."
              >
                Computed
              </span>
            ) : null}
          </span>
        </div>
      )
    })

  return (
    <div>
      <SectionTitle>
        <span className="flex items-center justify-between">
          <div className="flex gap-2.5">
            <MdOutlineManageSearch size={26} className="mb-0.5" />
            MYA Details
          </div>
          {!!metaprojectData?.id && canViewMetaProjects && (
            <Link
              className="border-primary bg-primary font-bold text-white hover:bg-primary hover:text-mlfs-hlYellow"
              href={`/projects-listing/update-mya-data/${metaprojectData.id}`}
              button
            >
              Edit
            </Link>
          )}
        </span>
      </SectionTitle>
      {!!metaprojectData?.id ? (
        <div className="flex gap-x-8">
          <div>
            <div className={metadatDisplayClassname}>
              {renderFieldData(fieldData.slice(0, 6))}
            </div>
            <Divider className="my-3" />
            <div className={metadatDisplayClassname}>
              {renderFieldData(fieldData.slice(6, 9))}
            </div>
            <Divider className="my-3" />
            <div className={metadatDisplayClassname}>
              {renderFieldData(fieldData.slice(9))}
            </div>
          </div>
        </div>
      ) : (
        <CircularProgress color="inherit" size="24px" className="ml-1.5" />
      )}
    </div>
  )
}

export default ProjectRelatedProjectsMetaProject

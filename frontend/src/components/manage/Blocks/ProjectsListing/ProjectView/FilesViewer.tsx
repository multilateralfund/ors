import { useContext, useEffect, useState } from 'react'

import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { ProjectDocs, ProjectFile } from '../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { Button, Divider } from '@mui/material'
import { TbFiles } from 'react-icons/tb'
import { filter } from 'lodash'

export function FilesViewer(props: ProjectDocs) {
  const { bpFiles, files, setFiles, mode, project } = props

  const { canUpdateProjects } = useContext(PermissionsContext)

  const [currentFiles, setCurrentFiles] = useState<(ProjectFile | File)[]>([])

  useEffect(() => {
    const existingFiles = filter(
      bpFiles,
      (file) => !files?.deletedFilesIds?.includes(file.id),
    )

    const newFiles = files?.newFiles || []

    setCurrentFiles([...existingFiles, ...newFiles])
  }, [bpFiles, files])

  const handleDelete = (file: ProjectFile | File) => {
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
  }

  return (
    <div className="flex flex-col gap-2">
      <HeaderWithIcon title="File attachments" Icon={TbFiles} />
      {mode !== 'view' &&
        (!project || project?.submission_status === 'Draft') && (
          <>
            <div className="mt-5 flex gap-4">
              <Button
                disabled
                className="h-9 border border-solid px-3 py-1 leading-none"
                // className="h-9 border border-solid border-primary bg-white px-3 py-1 leading-none text-primary"
                size="large"
                variant="contained"
              >
                Download project template
              </Button>
              <a
                className="justify-content-center flex h-9 items-center rounded-lg border border-solid border-white bg-primary px-3 py-1 font-[500] uppercase leading-none text-white no-underline hover:border-mlfs-hlYellow hover:text-mlfs-hlYellow"
                href={formatApiUrl(
                  `/api/projects/v2/export?project_id=${project?.id}`,
                )}
              >
                Download Excel
              </a>
            </div>
            <Divider className="mt-4" />
          </>
        )}
      <div className="mt-3 flex flex-col gap-2.5">
        {currentFiles.length === 0 ? (
          <p className="m-1 ml-0 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          currentFiles.map((file, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <a
                className="m-0 flex items-center gap-2.5 no-underline"
                href={
                  (file as ProjectFile).download_url
                    ? formatApiUrl((file as ProjectFile).download_url)
                    : URL.createObjectURL(file as File)
                }
                {...(!(file as ProjectFile).download_url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
              >
                <IoDownloadOutline className="mb-1 min-h-[20px] min-w-[20px] text-secondary" />
                <span className="text-lg font-medium text-secondary">
                  {(file as ProjectFile).filename || file.name}
                </span>
              </a>

              {setFiles &&
                canUpdateProjects &&
                ('editable' in file ? file.editable : true) && (
                  <IoTrash
                    className="transition-colors mb-1 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
                    onClick={() => handleDelete(file)}
                  />
                )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

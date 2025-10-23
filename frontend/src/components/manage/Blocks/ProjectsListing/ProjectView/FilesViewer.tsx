import { useEffect, useState } from 'react'

import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import ExportConfirmModal from './ExportConfirmModal'
import { ProjectDocs, ProjectFile } from '../interfaces'
import { exportButtonClassname } from '../constants'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { CircularProgress, Divider } from '@mui/material'
import { TbFiles } from 'react-icons/tb'
import { filter, isNil } from 'lodash'
import cx from 'classnames'

export function FilesViewer(props: ProjectDocs) {
  const { bpFiles, files, setFiles, mode, project, loadedFiles } = props

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
    <>
      <div className="flex flex-col gap-2">
        <HeaderWithIcon title="File attachments" Icon={TbFiles} />
        <div className="mt-5 flex gap-4">
          {mode === 'edit' &&
            ['Draft', 'Submitted', 'Recommended'].includes(
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

        {!isNil(loadedFiles) && !loadedFiles ? (
          <CircularProgress color="inherit" size="30px" className="mt-2" />
        ) : (
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
                    download={(file as ProjectFile).filename || file.name}
                  >
                    <IoDownloadOutline className="mb-1 min-h-[20px] min-w-[20px] text-secondary" />
                    <span className="text-lg font-medium text-secondary">
                      {(file as ProjectFile).filename || file.name}
                    </span>
                  </a>

                  {setFiles && ('editable' in file ? file.editable : true) && (
                    <IoTrash
                      className="transition-colors mb-1 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
                      onClick={() => handleDelete(file)}
                    />
                  )}
                </div>
              ))
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

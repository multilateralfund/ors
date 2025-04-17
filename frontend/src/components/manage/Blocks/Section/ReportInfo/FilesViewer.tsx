import { ApiFile } from '@ors/types/api_files'

import { useSnackbar } from 'notistack'

import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { api, formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { TbFiles } from 'react-icons/tb'

export function FilesViewer(props: {
  files?: ApiFile[]
  heading: string
  isEdit: boolean
}) {
  const { enqueueSnackbar } = useSnackbar()
  const { cacheInvalidateReport, fetchFiles } = useStore(
    (state) => state.cp_reports,
  )

  if (!props.files) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <HeaderWithIcon title={props.heading} Icon={TbFiles} />
      <div className="mt-3 flex flex-col gap-2.5">
        {props.files.length === 0 ? (
          <p className="m-1 ml-0 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          props.files.map((file, index) => (
            <div key={index} className="flex items-center gap-2">
              <a
                className="m-0 flex items-center gap-2.5 no-underline"
                href={formatApiUrl(file.download_url)}
              >
                <IoDownloadOutline className="mb-1 min-h-[20px] min-w-[20px] text-secondary" />
                <span className="text-lg font-medium text-secondary">
                  {file.filename}
                </span>
              </a>
              {props.isEdit && (
                <IoTrash
                  className="transition-colors mb-1 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
                  onClick={async () => {
                    try {
                      await api(
                        `api/country-programme/files/?country_id=${file.country_id}&year=${file.year}`,
                        {
                          data: {
                            file_ids: [file.id],
                          },
                          // TODO: Ask backend for proper DELETE endpoint
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          method: 'DELETE',
                        },
                      )
                      cacheInvalidateReport(file.country_id, file.year)
                      fetchFiles(file.country_id, file.year)
                    } catch (e) {
                      enqueueSnackbar(
                        <>
                          There was an error regarding the files. Please try
                          again.
                        </>,
                        {
                          variant: 'error',
                        },
                      )
                    }
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

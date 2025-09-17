import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { ProjectVersions } from '../interfaces'
import useClickOutside from '@ors/hooks/useClickOutside'

import { IoChevronDown } from 'react-icons/io5'
import cx from 'classnames'

export const VersionsDropdown = ({
  versions,
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  versions: ProjectVersions[]
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const formattedVersions = versions.map((version, idx) => {
    let label
    if (version.version > 3) {
      label = `Version ExCom ${version.post_excom_meeting}`
    } else {
      label = `Version ${version.version}`
    }
    return {
      id: version.id,
      label: label,
      url:
        idx == 0
          ? `/projects-listing/${version.id}`
          : `/projects-listing/${version.id}/archive/${version.version}`,
    }
  })

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowVersionsMenu(false)
  })

  const toggleShowVersionsMenu = () => setShowVersionsMenu((prev) => !prev)

  return (
    <div className="relative">
      <div
        ref={ref}
        onClick={toggleShowVersionsMenu}
        className="flex cursor-pointer items-center justify-between gap-x-2"
      >
        <IoChevronDown className="text-5xl font-bold text-gray-700" />
      </div>
      <div
        className={cx(
          'absolute right-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showVersionsMenu,
            'scale-y-100 opacity-100': showVersionsMenu,
          },
        )}
      >
        {formattedVersions.map((info, idx) => (
          <Link
            key={info.id}
            href={info.url}
            className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
          >
            <div className="flex w-40 items-center justify-between hover:text-white">
              <div className="ml-1">{info.label}</div>
              <div className="flex items-center">
                {idx == 0 && (
                  <span className="mx-1 rounded-md bg-gray-400 p-1 text-xs uppercase text-white">
                    Latest
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const HeaderTag = ({
  latest_project,
  version,
}: {
  latest_project: number | null
  version: number | string
}) => (
  <span className="self-baseline whitespace-nowrap rounded bg-mlfs-hlYellow p-1 font-medium uppercase leading-none">
    {latest_project ? `Version ${version}` : 'Latest'}
  </span>
)

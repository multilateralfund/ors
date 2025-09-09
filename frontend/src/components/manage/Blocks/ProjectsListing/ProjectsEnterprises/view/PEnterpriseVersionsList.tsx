import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import useClickOutside from '@ors/hooks/useClickOutside'

import { IoChevronDown } from 'react-icons/io5'
import { useParams } from 'wouter'
import cx from 'classnames'

const PEnterpriseVersionsList = ({
  versions,
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  versions: number[]
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const { project_id } = useParams<Record<string, string>>()

  const formattedVersions = versions.map((version) => ({
    id: version,
    label: `${version}`,
    url: `/projects-listing/projects-enterprises/${project_id}/view/${version}`,
  }))

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
        {formattedVersions.map((info) => (
          <Link
            key={info.id}
            href={info.url}
            className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
          >
            <div className="ml-1 flex w-40 items-center hover:text-white">
              {info.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default PEnterpriseVersionsList

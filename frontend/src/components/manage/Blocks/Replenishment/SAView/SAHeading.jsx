'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SoAContext from '@ors/contexts/Replenishment/SoAContext'
import useClickOutside from '@ors/hooks/useClickOutside'

import { IoChevronDown } from 'react-icons/io5'

function SAHeading(props) {
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const { setCurrentVersion, version, versions } = useContext(SoAContext)

  function toggleShowVersionsMenu() {
    setShowVersionsMenu((prev) => !prev)
  }

  const ref = useClickOutside(function () {
    setShowVersionsMenu(false)
  })


  function handleClickVersion(v) {
    return function() {
      setCurrentVersion(v.id)
      setShowVersionsMenu(false)
    }
  }


  const tagLatest = (
    <span className="mx-2 rounded-md bg-gray-400 p-1 text-xs text-white">
      LATEST
    </span>
  )
  const tagDraft = (
    <span className="mx-2 rounded-md bg-warning p-1 text-xs text-white">
      Draft
    </span>
  )

  return (
    <ReplenishmentHeading showPeriodSelector={true}>
      <div className="relative">
        <div
          className="flex cursor-pointer items-center justify-between gap-x-2"
          ref={ref}
          onClick={toggleShowVersionsMenu}
        >
          <div className="flex items-center gap-x-2">
            <div>Scale of assessment</div>
            <IoChevronDown className="print:hidden text-5xl font-bold text-gray-700" />
            <div className="print:hidden rounded bg-mlfs-hlYellow px-1 text-base font-medium uppercase text-primary">
              Version {version?.id}{' '}
              {version?.isDraft ? `(${version?.status})` : null}
            </div>
            {version?.isFinal ? (
              <div className="print:hidden rounded bg-primary px-1 text-base font-medium uppercase text-mlfs-hlYellow">
                final
              </div>
            ) : null}
          </div>
        </div>
        <div
          className={cx(
            'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 text-base font-normal opacity-0 transition-all',
            {
              'collapse scale-y-0': !showVersionsMenu,
              'scale-y-100 opacity-100': showVersionsMenu,
            },
          )}
        >
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className="flex cursor-pointer items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
              onClick={handleClickVersion(v)}
            >
              <div
                className={cx(
                  'flex items-center justify-between hover:text-white',
                  { 'font-bold': v.id === version?.id },
                )}
              >
                <div>Version {v.id}</div>
                <div className="flex items-center">
                  {idx == 0 && (v.isFinal ? tagLatest : tagDraft)}
                  {idx == 1 && versions[0].isDraft && tagLatest}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ReplenishmentHeading>
  )
}

export default SAHeading
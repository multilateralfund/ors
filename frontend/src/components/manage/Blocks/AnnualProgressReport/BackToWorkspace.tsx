import React from 'react'
import { IoReturnUpBack } from 'react-icons/io5'
import { Link } from 'wouter'

export default function BackToWorkspace({ year }: { year?: string }) {
  const url = year ? `/${year}/workspace` : '/apr'

  return (
    <Link className="text-black no-underline" href={url}>
      <div className="mb-2 flex items-center gap-2 text-lg uppercase">
        <IoReturnUpBack size={18} />
        Annual Progress Report Workspace
      </div>
    </Link>
  )
}

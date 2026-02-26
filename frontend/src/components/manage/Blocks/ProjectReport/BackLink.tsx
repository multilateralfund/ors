import React from 'react'
import { IoReturnUpBack } from 'react-icons/io5'
import { Link } from 'wouter'

export default function BackLink({ url, text }: { url: string; text: string }) {
  return (
    <Link className="inline-block max-w-fit text-black no-underline" href={url}>
      <div className="mb-2 flex items-center gap-2 text-lg uppercase">
        <IoReturnUpBack size={18} />
        {text}
      </div>
    </Link>
  )
}

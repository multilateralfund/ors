import React from 'react'

export default function BPEdit(props: any) {
  const { agency, end_year, start_year } = props

  return (
    <div className="flex flex-col gap-2">
      <span>{agency}</span>
      <span>{start_year}</span>
      <span>{end_year}</span>
    </div>
  )
}

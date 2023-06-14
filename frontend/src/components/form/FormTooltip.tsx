import { Tooltip } from 'flowbite-react'
import { IoHelpCircle } from 'react-icons/io5'

export const FormTooltip = ({ content }: { content: string }) => {
  return (
    <Tooltip content={content} trigger="hover">
      <IoHelpCircle />
    </Tooltip>
  )
}

import { Divider } from '@mui/material'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'

export type HeaderTitleProps = {
  children: React.ReactNode
}

export default function HeaderTitle({ children }: HeaderTitleProps) {
  return (
    <Portal domNode="header-title">
      <FadeInOut>
        <Divider className="-ml-4 mb-12 mt-4 w-[calc(100%+2rem)]" />
        {children}
        <div className="mb-4" />
      </FadeInOut>
    </Portal>
  )
}

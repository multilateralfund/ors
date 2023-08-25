import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'

export type HeaderTitleProps = {
  children: React.ReactNode
}

export default function HeaderTitle({ children }: HeaderTitleProps) {
  return (
    <Portal domNode="header-title">
      <FadeInOut>
        <div className="-ml-4 mb-12 mt-4 h-[1px] w-[calc(100%+2rem)] bg-gray-200" />
        {children}
        <div className="mb-4" />
      </FadeInOut>
    </Portal>
  )
}

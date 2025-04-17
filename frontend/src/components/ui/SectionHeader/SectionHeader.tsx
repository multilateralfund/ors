export const HeaderWithIcon = ({
  title,
  Icon,
}: {
  title: string
  Icon: any
}) => (
  <div className="flex gap-2.5">
    <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[14px] bg-primary">
      <Icon className="text-mlfs-hlerYellowTint" size={16} />
    </div>
    <p className="m-0 mt-[1px] text-2xl font-normal">{title}</p>
  </div>
)

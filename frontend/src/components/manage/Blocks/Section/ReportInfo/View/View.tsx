import Typography from '@mui/material/Typography'

import { FilesViewer } from '@ors/components/manage/Blocks/Section/ReportInfo/FilesViewer'
import ReportHistory from '@ors/components/manage/Blocks/Section/ReportInfo/ReportHistory'
import ReportStatus from '@ors/components/manage/Blocks/Section/ReportInfo/ReportStatus'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import { useStore } from '@ors/store'
import { HeaderWithIcon } from '../../../BusinessPlans/HelperComponents'
import { BsFilesAlt } from 'react-icons/bs'
import { Divider } from '@mui/material'

const ReportInfoView = (props: any) => {
  const { report, section } = props
  const files = useStore((state: any) => state.cp_reports.report.files.data)

  const username = report.created_by

  const sectionsChecked = {
    section_a: report.report_info?.reported_section_a ?? true,
    section_b: report.report_info?.reported_section_b ?? true,
    section_c: report.report_info?.reported_section_c ?? true,
    section_d: report.report_info?.reported_section_d ?? true,
    section_e: report.report_info?.reported_section_e ?? true,
    section_f: report.report_info?.reported_section_f ?? true,
  }

  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <Typography className="md:col-span-2" component="h2" variant="h6">
        {section.title}
      </Typography>

      <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
        <HeaderWithIcon title="Summary" Icon={BsFilesAlt} />
        <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
          <SimpleField
            id="username"
            className="col-span-2 lg:col-span-1"
            data={username}
            label="Username"
            textClassName="text-[1.25rem]"
          />
          <SimpleField
            id="name_reporting_officer"
            data={report.report_info?.reporting_entry || ''}
            label="Name of reporting officer"
            textClassName="text-[1.25rem]"
          />
          <SimpleField
            id="email_reporting_officer"
            data={report.report_info?.reporting_email || ''}
            label="Email of reporting officer"
            textClassName="text-[1.25rem]"
          />
          <SimpleField
            id="country"
            data={report.country}
            label="Country"
            textClassName="text-[1.25rem]"
          />
          <SimpleField
            id="year"
            data={report.year}
            label="Year"
            textClassName="text-[1.25rem]"
          />
        </div>
        <Divider />
        <FilesViewer
          files={files}
          heading={'File attachments'}
          isEdit={false}
        />
      </div>

      <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
        <ReportStatus report={report} sectionsChecked={sectionsChecked} />
        <Divider />
        <ReportHistory />
      </div>
    </section>
  )
}

export default ReportInfoView

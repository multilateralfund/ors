import Typography from '@mui/material/Typography'

import ReportHistory from '@ors/components/manage/Blocks/Section/ReportInfo/ReportHistory'
import ReportStatus from '@ors/components/manage/Blocks/Section/ReportInfo/ReportStatus'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import { useStore } from '@ors/store'

import { IoDocumentTextOutline } from 'react-icons/io5'

const ReportInfoView = (props: any) => {
  const { report, section } = props
  const user = useStore((state) => state.user)

  const sectionsChecked = {
    section_a: report.report_info?.reported_section_a || false,
    section_b: report.report_info?.reported_section_b || false,
    section_c: report.report_info?.reported_section_c || false,
    section_d: report.report_info?.reported_section_d || false,
    section_e: report.report_info?.reported_section_e || false,
    section_f: report.report_info?.reported_section_f || false,
  }

  return (
    <section className="grid items-start gap-4 md:auto-rows-auto md:grid-cols-2">
      <Typography className="md:col-span-2" component="h2" variant="h6">
        {section.title}
      </Typography>

      <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
        <p className="m-0 text-2xl font-normal">Summary</p>
        <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
          <SimpleField
            id="username"
            className="col-span-2 lg:col-span-1"
            data={user.data.username}
            label="Username"
          />
          <SimpleField
            id="name_reporting_officer"
            data={report.report_info?.reporting_entry || ''}
            label="Name of reporting officer"
          />
          <SimpleField
            id="email_reporting_officer"
            data={report.report_info?.reporting_email || ''}
            label="Email of reporting officer"
          />
          <SimpleField id="country" data={report.country} label="Country" />
          <SimpleField id="year" data={report.year} label="Year" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="m-0 text-2xl font-normal">File attachments</p>
          <div className="flex flex-col gap-3">
            <p className="m-0 flex items-center gap-2">
              <IoDocumentTextOutline color="#0086C9" size="20" />
              <span className="text-lg text-gray-900">
                Pollution_Control_Strategies_report.doc
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <ReportStatus sectionsChecked={sectionsChecked} />
        <ReportHistory />
      </div>
    </section>
  )
}

export default ReportInfoView

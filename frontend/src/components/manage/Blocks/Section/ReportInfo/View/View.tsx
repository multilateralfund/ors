import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Typography from '@mui/material/Typography'

import { useStore } from '@ors/store'

import { IoDocumentTextOutline } from 'react-icons/io5'

const SimpleField = ({
  id,
  className,
  data,
  hasName,
  label,
}: {
  className?: string
  data: string
  hasName?: boolean
  id: string
  label: string
}) => {
  return (
    <div className={className}>
      <label className="block text-lg font-normal text-gray-900" htmlFor={id}>
        {label}
      </label>
      <p className="my-0 text-xl font-semibold">{data}</p>
      {hasName && (
        <input id={id} name={id} type="text" value={data} hidden readOnly />
      )}
    </div>
  )
}

const ReportInfoView = (props: any) => {
  const { report, section } = props
  const user = useStore((state) => state.user)

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
            data={user.data.username}
            label="Name of reporting officer"
          />
          <SimpleField
            id="email_reporting_officer"
            data={user.data.email}
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
        <div className="flex flex-wrap gap-4">
          <FormControl
            className="inline-flex flex-col"
            component="fieldset"
            fullWidth={false}
            variant="standard"
          >
            <legend className="mb-3 text-2xl font-normal">Status</legend>
            <FormGroup className="rounded-lg bg-white px-4 py-1 shadow-lg" row>
              <FormControlLabel
                control={<Checkbox size="small" defaultChecked />}
                label="Final"
                disabled
              />
            </FormGroup>
          </FormControl>
          <FormControl
            className="inline-flex flex-col"
            component="fieldset"
            fullWidth={false}
            variant="standard"
          >
            <legend className="mb-3 text-2xl font-normal">
              Sections reported
            </legend>
            <FormGroup className="rounded-lg bg-white px-4 py-1 shadow-lg" row>
              <FormControlLabel
                color="primary"
                control={<Checkbox size="small" />}
                label="Section A"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Section B"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Section C"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Section D"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Section E"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Section F"
              />
            </FormGroup>
          </FormControl>
        </div>
        <div>
          <p className="mb-3 text-2xl font-normal">History</p>
          <div className="flex flex-col flex-wrap justify-center gap-2 rounded-lg bg-white px-4 py-1 shadow-lg">
            {[...Array(3)].map((_, index) => {
              const randomDate = new Date(
                +new Date() - Math.floor(Math.random() * 10000000000),
              )
              return (
                <div
                  key={index}
                  className="flex grow items-center justify-between gap-3 text-pretty"
                >
                  <div className="flex items-center gap-2">
                    <p
                      id={`report_date_${index}`}
                      className="my-1 min-w-24 text-right text-sm font-normal text-gray-500"
                    >
                      {randomDate.toDateString()}
                    </p>
                    <p
                      id={`report_summary_${index}`}
                      className="text-md my-1 font-medium text-gray-900"
                    >
                      Report commentary {index}
                    </p>
                  </div>
                  <div>
                    <p
                      id={`report_user_${index}`}
                      className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
                    >
                      Reported by user {index}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReportInfoView

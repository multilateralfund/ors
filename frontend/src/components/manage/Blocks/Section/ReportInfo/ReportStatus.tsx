import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'

const ReportStatus = () => {
  return (
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
        <legend className="mb-3 text-2xl font-normal">Sections reported</legend>
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
  )
}

export default ReportStatus

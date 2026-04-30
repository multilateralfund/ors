import { formatApiUrl } from '@ors/helpers'
import { Box } from '@mui/material'

const ProjectsSettingsListsOfTerms = () => {
  const firstColumnClassName = 'py-2 pr-6'
  const secondColumnClassName = 'px-6 py-2'

  return (
    <Box>
      <h2 className="mt-2 text-3xl">
        Management of values for the pick lists used in the IA/BA portal
      </h2>

      <h2 className="mt-6">Project specific fields</h2>

      <p>
        Defines impact fields for a given cluster/type/sector combination. Both
        the planned and actual indicator need to be added.
      </p>
      <p>
        <strong>Warning:</strong> do not add any other fields than the specific
        ones, because the cross cutting and identifier ones are defined for
        consistency and implementation purposes. It is best to import the
        combinations from the respective file.
      </p>

      <p>
        These fields can be added from{' '}
        <a
          className="italic text-inherit"
          target="_blank"
          rel="noopener noreferrer nofollow"
          href={formatApiUrl('/admin/core/projectspecificfields/')}
        >
          /admin/core/projectspecificfields/
        </a>
      </p>

      <h2 className="mt-8">Substances</h2>

      <tr>
        <th className={firstColumnClassName}>Label in application</th>
        <th className={secondColumnClassName}>Values</th>
      </tr>

      <tr>
        <td className={firstColumnClassName}>Substances</td>
        <td className={secondColumnClassName}>
          <a
            className="italic text-inherit"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href={formatApiUrl('/admin/core/substance/')}
          >
            /admin/core/substance/
          </a>
        </td>
      </tr>

      <tr>
        <td className={firstColumnClassName}>Substance alternative names</td>
        <td className={secondColumnClassName}>
          <a
            className="italic text-inherit"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href={formatApiUrl('/admin/core/substancealtname/')}
          >
            /admin/core/substancealtname/
          </a>
        </td>
      </tr>

      <h2 className="mt-8">
        Fields that cannot be changed in the Master Database
      </h2>

      <p>
        The following fields are defined in the database, but they can only be
        changed by programmers, because of their impact in the application's
        logic:
      </p>
      <ul>
        <li>Project statuses</li>
        <li>Project submission statuses</li>
      </ul>

      <p>
        The following fields do not have the values stored in the Master
        Database; the values are defined in the source code:
      </p>

      <tr>
        <th className={firstColumnClassName}>Label in application</th>
        <th className={secondColumnClassName}>Values</th>
      </tr>
      <tr>
        <td className={firstColumnClassName}>
          Blanket approval or individual consideration
        </td>
        <td className={secondColumnClassName}>
          Blanket
          <br />
          Individual
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Consumption level status</td>
        <td className={secondColumnClassName}>
          LVC
          <br />
          Non-LVC
          <br />
          N/A
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Production control type</td>
        <td className={secondColumnClassName}>
          Reduction
          <br />
          Closure
          <br />
          Switch to production for feedstock uses
          <br />
          Conversion to non-controlled substance
          <br />
          Other
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Category</td>
        <td className={secondColumnClassName}>
          Multi-year agreement
          <br />
          Individual
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Attachments → Type</td>
        <td className={secondColumnClassName}>
          Project proposal
          <br />
          Endorsement/transmittal letter from government
          <br />
          Verification report
          <br />
          Project review comments
          <br />
          Transferred project proposal
          <br />
          Other
        </td>
      </tr>
    </Box>
  )
}

export default ProjectsSettingsListsOfTerms

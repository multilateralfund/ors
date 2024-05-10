import * as React from 'react'

import { Box } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

const CPSettings: React.FC = () => {
  return (
    <Box
      alignItems="center"
      display="flex"
      height="100" // Adjust this value as needed
      justifyContent="center"
    >
      <form>
        <Field widget="chipToggle" />
      </form>
    </Box>
  )
}

export default CPSettings

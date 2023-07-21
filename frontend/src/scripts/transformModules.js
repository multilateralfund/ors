const path = require('path')
const fs = require('fs')
const mui = require('@mui/material')

const muiPath = path.resolve('node_modules', '@mui/material')
const transformModulesFile = `${process.cwd()}/transform.modules.json`

const transformModules = {
  '@mui/material': {},
}

function startsWithUppercase(str) {
  return str[0] === str[0].toUpperCase()
}

Object.keys(mui).forEach((component) => {
  if (startsWithUppercase(component)) {
    try {
      const optimPath = `@mui/material/${component}/${component}`
      require.resolve(optimPath)
      transformModules['@mui/material'][component] = optimPath
    } catch (error) {
      try {
        const optimPath = path.resolve(muiPath, component)
        require.resolve(optimPath)
        transformModules['@mui/material'][component] = path.relative(
          `${process.cwd()}/node_modules`,
          optimPath,
        )
      } catch {}
    }
  }
})

const transformModulesData = JSON.stringify(transformModules, null, 2)

fs.writeFile(transformModulesFile, transformModulesData, 'utf8', (err) => {
  if (err) {
    console.error('Error transforming modules:', err)
  } else {
    console.log(
      `Modules successfully transformed and written to ${transformModulesFile}`,
    )
  }
})

function getPath(str) {
  if (str) {
    return `/${str}`
  }
  return ''
}

const transformModules = require('./transform.modules.json')

module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      'transform-imports',
      {
        // lodash: {
        //   transform: 'lodash/${member}',
        //   preventFullImport: true,
        // },
        '@mui/material/?(((\\w*)?/?)*)': {
          transform: (importName, matches) => {
            const muiTransforms = transformModules['@mui/material']
            if (muiTransforms[importName]) {
              return muiTransforms[importName]
            }
            return `@mui/material${getPath(matches[1])}/${importName}`
          },
        },
      },
    ],
  ],
}

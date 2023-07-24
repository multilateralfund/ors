const fs = require('fs')
const glob = require('glob')

const root = process.cwd()

const transformModulesFile = `${root}/transform.modules.json`

const transformModules = {}

const modulesPaths = {
  '@mui/material': glob.sync(`${root}/node_modules/@mui/material/**/*.js`, {
    ignore: [
      `${root}/node_modules/@mui/material/modern/**/*.js`,
      `${root}/node_modules/@mui/material/node/**/*.js`,
      `${root}/node_modules/@mui/material/legacy/**/*.js`,
    ],
  }),
  '@ors/components': glob.sync(`${root}/src/components/**/*.{ts,tsx}`),
}

const getComponentName = (path) => {
  // Remove .js extension if it exists
  const pathWithoutExtension = path.replace(/\.(js|jsx|ts|tsx)$/, '')

  // Split the path by '/' to get individual parts
  const pathParts = pathWithoutExtension.split('/')

  // Get the last part of the path with the .js extension removed
  let lastPart = pathParts[pathParts.length - 1]

  // Check if the last part is 'index'
  if (lastPart === 'index') {
    // Remove 'index' from the pathParts array and get the new last part
    pathParts.pop()
  }

  return pathParts[pathParts.length - 1]
}

const getComponentPath = (paths) => {
  let optimizedPath = paths[0]
    .replace(`${root}/node_modules/`, '')
    .replace(/\.(js|jsx|ts|tsx)$/, '')
    .replace(/\/index$/, '')

  paths.forEach((path) => {
    // Remove .js extension if it exists
    const pathWithoutExtension = path.replace(/\.(js|jsx|ts|tsx)$/, '')

    // Split the path by '/' to get individual parts
    const pathParts = pathWithoutExtension.split('/')

    // Get the last part of the path with the .js extension removed
    let lastPart = pathParts[pathParts.length - 1]

    // Check if the last part is 'index'
    if (lastPart === 'index') {
      // Remove 'index' from the pathParts array and get the new last part
      pathParts.pop()
    }

    const parsedPath = pathParts.join('/').replace(`${root}/node_modules/`, '')

    if (parsedPath.length > optimizedPath) {
      optimizedPath = parsedPath
    }
  })

  return optimizedPath
}

const getComponent = (path) => {
  const subPaths = glob.sync(path)

  const componentSubPath = getComponentPath(subPaths)
  const componentPath = getComponentPath([path])

  return [
    getComponentName(path),
    componentPath.length > componentSubPath ? componentPath : componentSubPath,
  ]
}

Object.keys(modulesPaths).forEach((package) => {
  modulesPaths[package]
    .map((path) => {
      return getComponent(path)
    })
    .forEach((component) => {
      const [name, path] = component
      if (!transformModules[package]) {
        transformModules[package] = {}
      }
      if (
        !transformModules[package][name] ||
        path.length > transformModules[package][name].length
      ) {
        transformModules[package][name] = path
      } else if (path.length > transformModules[package][name]) {
        transformModules[package][name] = path
      }
    })
})

const transformModulesData = JSON.stringify(transformModules, null, 2)

fs.writeFile(transformModulesFile, transformModulesData, 'utf8', (err) => {
  if (err) {
    console.error('\nBefore build: error transforming modules:', err)
  } else {
    console.log(
      `\nBefore build: modules successfully transformed and written to ${transformModulesFile}`,
    )
  }
})

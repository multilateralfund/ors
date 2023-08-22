const fs = require('fs')
const version = require('../version.json')

const newVersion = {
  major: version.major,
  minor: version.minor,
  patch: version.patch + 1,
}

fs.writeFile(
  'version.json',
  JSON.stringify(newVersion, null, 2),
  'utf8',
  (err) => {
    if (err) throw err
    console.log('Version updated successfully')
  },
)

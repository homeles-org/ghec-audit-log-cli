const validate = require('validate.js')
const fs = require('fs')
const path = require('path')

function validateInput (program, config) {
  const parsed = {
    cursor: program.cursor || null,
    pretty: program.pretty || false,
    limit: program.limit || null,
    token: program.token || config.token,
    org: program.org || config.org,
    outputFile: program.file
  }

  // Validate correctness
  const alphanumericRegex = /^[a-z0-9]+$/i
    //const base64Regex = '(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)'
  const base64Regex = '.*'
  const orgRegex = /^[a-z\d]+(?:-?[a-z\d]+)*$/i
  const constraints = {
    cursor: {
      type: 'string',
      presence: false,
      format: base64Regex
    },
    pretty: {
      type: 'boolean',
      presence: true
    },
    limit: {
      presence: false,
      numericality: {
        onlyInteger: true,
        greaterThan: 0
      }
    },
    token: {
      type: 'string',
      presence: { allowEmpty: false },
      length: {
        is: 40
      },
      format: alphanumericRegex
    },
    org: {
      type: 'string',
      presence: { allowEmpty: false },
      length: {
        maximum: 39,
        minimum: 1
      },
      format: orgRegex
    },
    outputFile: {
      type: 'string',
      presence: false
    }
  }

  // Verify validation
  const validation = validate(parsed, constraints)
  if (!validate.isEmpty(validation)) {
    throw new Error(JSON.stringify(validation))
  }

  // Check that we can write into that file
  if (parsed.outputFile) {
    try {
      fs.openSync(parsed.outputFile, 'w')
    } catch (e) {
      throw new Error(`The output file ${parsed.outputFile} cannot be written or the path does not exist. ${e.message}`)
    }
  }
  // Check that if we are in GitHub actions the file is expected to be within the workspace
  if (process.env.GITHUB_ACTIONS) {
    console.log(process.env.GITHUB_ACTIONS)
    console.log(process.env.GITHUB_WORKSPACE)
    console.log(parsed.outputFile)
    const filePath = path.join(process.env.GITHUB_WORKSPACE, parsed.outputFile)
    const { dir } = path.parse(filePath)

    if (dir.indexOf(process.env.GITHUB_WORKSPACE) < 0) {
      throw new Error(`${parsed.outputFile} is not allowed. The directory should be within ${process.env.GITHUB_WORKSPACE}`)
    }
  }

  return parsed
}

module.exports = {
  validateInput
}

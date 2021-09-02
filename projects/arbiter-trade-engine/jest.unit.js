let base = require('jest-config-shapeshift').config
let config = {
    collectCoverageFrom: [
        'modules/**'
    ],
    roots: [
        'modules'
    ]
}

module.exports = Object.assign(base, config)

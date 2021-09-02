const base = require('jest-config-shapeshift').config
const config = {
    collectCoverageFrom: [
        '.',
        'modules',
        'support',
        'tools',
        'workers'
    ],
    roots: [
        '.',
        'modules',
        'support',
        'tools',
        'workers'
    ]
}

module.exports = Object.assign(base, config)

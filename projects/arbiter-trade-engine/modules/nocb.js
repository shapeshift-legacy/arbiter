'use strict'

/**
 * Convert node-style callback to promise / async / await.
 * Provides a callback ((err, res)=>{}), outputs a promise.
 * e.g. `await nocb(cb => { fs.readFile('file.txt', cb) })`
 */
const nocb = module.exports = exports = function nocb (code) {
    return new Promise((resolve, reject) => {
        try {
            code((err, res) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(res)
            })
        } catch (e) {
            reject(e)
        }
    })
}

/**
 * Run through an object, inspecting all functions, creating a
 * `<name>Async` version of them that no longer takes a callback,
 * and instead, returns a promise.
 */
exports.promisifyAll = function promisifyAll (obj) {
    const keys = Object.getOwnPropertyNames(obj)
    for (let key of keys) {
        if (key === 'constructor') continue
        const desc = Object.getOwnPropertyDescriptor(obj, key)
        if (desc === null || desc.get || desc.set) continue
        if (typeof obj[key] !== 'function') continue

        const asyncKey = key + 'Async'
        if (obj.hasOwnProperty(asyncKey)) {
            throw new Error('cannot promisify "' + key + '", "' +
                asyncKey + '" already exists.')
        }

        obj[asyncKey] = function (...args) {
            return nocb(cb => {
                args.push(cb)
                obj[key].apply(this, args)
            })
        }
    }
}
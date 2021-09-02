
const filterObject = require('../modules/filter-object')

describe('filter object', () => {
  test('does basic filtering', () => {
    let obj = {
      a: "b",
      b: false,
      c: undefined
    }

    let o1 = filterObject(obj, ['a'])
    expect(Object.keys(o1).length).toBe(1)
    expect(o1.a).toBe("b")
    expect(o1.b).toBeUndefined()
  })

  test('does not ignore props with value of `undefined`', () => {
    let obj = {
      a: "b",
      b: undefined
    }

    let o1 = filterObject(obj, ['a','b'])
    expect(Object.keys(o1).length).toBe(2)
    expect(o1.a).toBe("b")
    expect(o1.b).toBeUndefined()
  })

  test('does not add keys that weren\'t there before', () => {
    let obj = {
      a: "b"
    }

    let o1 = filterObject(obj, ['a','b'])
    expect(Object.keys(o1).length).toBe(1)
    expect(o1.a).toBe("b")
    expect(o1.b).toBeUndefined()
  })
})


const AccountRouter = require("../routes/account")

describe('account router', () => {
  test('validates when wallet address changes', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a", contractAddress: "z" }
    let exist = { ethAddress: "a", contractAddress: "x" }
    expect(f(input, exist)).toBe(true)
  })

  test('validates when eth address changes', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a", contractAddress: "z" }
    let exist = { ethAddress: "b", contractAddress: "z" }
    expect(f(input, exist)).toBe(true)
  })

  test('does not validate when no wallet address is present', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a" }
    let exist = { ethAddress: "b" }
    expect(f(input, exist)).toBe(false)
  })

  test('validates when addr changes against existing wallet', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a" }
    let exist = { ethAddress: "b", contractAddress: "z" }
    expect(f(input, exist)).toBe(true)
  })

  test('validates when new values are passed in', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a", contractAddress: "z" }
    let exist = {}
    expect(f(input, exist)).toBe(true)
  })

  test('validates when new wallet address is passed in', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a", contractAddress: "z" }
    let exist = { ethAddress: "a" }
    expect(f(input, exist)).toBe(true)
  })

  test('does not validate when no change', () => {
    let f = AccountRouter._shouldValidateWallet

    let input = { ethAddress: "a", contractAddress: "z" }
    let exist = { ethAddress: "a", contractAddress: "z" }
    expect(f(input, exist)).toBe(false)
  })
})

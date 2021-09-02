const helpers = require('../modules/helpers.js')
const util = require('ethereumjs-util');

describe('helpers', () => {
  const address = "0xfd6d2028c11ee3b118416ee1e35f09ef2332face"
  const privkey = "<redacted>"
  const expireTime = 1522530789
  const sequenceId = 1
  const amountInEth = 0.001
  const data = ''

  test('has an expected ophash and signature', () => {
    const operationHash = helpers.getSha3ForConfirmationTx(
      address,
      amountInEth,
      data,
      expireTime,
      sequenceId
    )

    let pk = Buffer.from(privkey,'hex')
    let otherSig = helpers.serializeSignature(util.ecsign(operationHash, pk))

    expect(operationHash.toString('hex')).toEqual("a5d8a1c4c955dda4059b7db582f79f44bbd3eb10005c6cd72f6577eb17fc8e6d")
    expect(otherSig).toEqual("0xc9392ddbf0d37e93564ea3d06c45d907f5321218122ab6353ab2b2546a2cd0e8659b7d029cd816e77a915e03fe5edc3f49b40edebf95d2f85c6ee6747fd357521b")
  })

})

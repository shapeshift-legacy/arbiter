const util = require('ethereumjs-util');

exports.accounts = [
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>',
  '<redacted>'
].map((privkeyHex) => {
  const privkey = Buffer.from(privkeyHex.replace(/^0x/i, ''), 'hex');
  const pubkey = util.privateToPublic(privkey);
  const address = util.pubToAddress(pubkey);
  return { privkey, pubkey, address };
});


const mapAddrToAcct = exports.accounts.reduce(
  (obj, { address, privkey }) => Object.assign(obj, { [address.toString('hex')]: privkey }), {}
);

console.log(`mapAddr`, mapAddrToAcct)

exports.privateKeyForAccount = (acct) => {
  const result = mapAddrToAcct[util.stripHexPrefix(acct).toLowerCase()];
  if (!result) {
    throw new Error('no privkey for ' + acct);
  }
  
  return result;
};

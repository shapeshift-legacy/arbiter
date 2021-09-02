
if [ ! -d build/contracts ]; then
  echo "no compiled contracts found, assuming initial install - running 'truffle compile'"
  mkdir -p build/contracts
  npm run truffle-compile
else
  echo "found compiled contracts, skipping this step for expedience"
  find build/contracts
fi

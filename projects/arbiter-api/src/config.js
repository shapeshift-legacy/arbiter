// defaults, overrideable via environment variables

module.exports = {
  API_HOST: process.env.REACT_APP_API_HOST || "",
  IS_TESTNET: process.env.REACT_APP_IS_TESTNET || "true",
}

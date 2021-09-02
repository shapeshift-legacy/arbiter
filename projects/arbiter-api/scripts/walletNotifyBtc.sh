echo "wallet-notify-called with txid $1" >> /tmp/btc-wn.log
curl -X GET "http://localhost:3000/api/v1/txid/BTC/${1}"


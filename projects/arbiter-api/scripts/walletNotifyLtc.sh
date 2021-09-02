#!/bin/bash

NOTIFY_LOG=/mnt/data/wallet/.litecoin/notify.log
echo "wallet-notify-called with txid $1" >> $NOTIFY_LOG
curl -v -k -X GET "https://arb-api01.internal.redacted.example.com:3000/api/v1/txid/ltc/$1" >> $NOTIFY_LOG 2>&1

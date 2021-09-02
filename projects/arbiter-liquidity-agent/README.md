# arbiterLA
arbiters liquidate agent. Market maker.

To run LiquidityAgent, start up mongo and redis.

Currently, it has eth_btc and ltc_btc for Binance.
To add a coin, add codes in these 2 files:
- process.json
- modules/binance/exchangeBook line 22

In redis
relevant keys:
	for hot wallet balance:
	BTC_HotBal, ETH_HotBal, LTC_HotBal

	for current Binance book:
	laOrderbookCurrent  with ETH_BTC and LTC_BTC fields


In Mongo
db: liquidityAgent-mongo
colllection: exchangeBook


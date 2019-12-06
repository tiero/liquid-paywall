# liquid-paywall
Portbale browser paywall to accept Liquid Bitcoin and Assets

# Development

* Install deps
`yarn`
* Serve and pass the Liquid address for the merchant
`MERCHANT_ADDR="2dp9bnXs7Q9id5tfxFuZ7nLwdcGywFRoXms" yarn serve`


# Demo regtest

1) Pay with faucet 
`curl -X POST https://regtest.vulpem.com/liquid/api/faucet -H 'Content-Type: application/json' -d '{"address": "addressDispayed"}'`
2) Broadcast and inspect using returned hash `https://regtest.vulpem.com/liquid/api/tx/<txHash>`
3) Decode the OP_RETURN with `echo <scriptpubkey> | xxd -p -r`
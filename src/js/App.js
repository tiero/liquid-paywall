import React, { Component } from "react";
import { ECPair, payments, networks } from "liquidjs-lib";

import QRCode from 'qrcode.react';

import { getUtxo, broadcast, buildAndSignTransaction } from "./utils";


const network = networks.regtest;

class App extends Component {

  constructor() {
    super();
    this.state = { 
      address: "",
      balance: 0,
      hex: null,
      txId: null
    }
  }

  componentDidMount() {

    //const keyPair = ECPair.fromWIF("cUHCQw9jhSEMHSHtsxQLALM9TMsyr7bjwA66KP9s4WSjJXM2kwfD", network);
    const keyPair = ECPair.makeRandom({network});
    const merchantAddress = process.env["MERCHANT_ADDR"] || "2dp9bnXs7Q9id5tfxFuZ7nLwdcGywFRoXms"; //cMvRgEQPDvE1cWUvfbTfWTT2RXncy1jmii9YGdqXzE4sYYJHNoeZ
    const { address } = payments.p2pkh({ pubkey: keyPair.publicKey, network })

    this.setState({ address });

    this.startWatching(
      address,
      500,
      (balance, utxos) => {

        const hex = buildAndSignTransaction({
          network,
          //L-BTC tx details
          from:address,
          to:merchantAddress,
          amount: 15000,
          // Utxos of the ephemeral wallet
          utxos,
          // ephemeral wallet keys
          keyPair,
          //String to embed into blockchain
          payload: `{"a":1342,""b":235243,"c":3869,"e":678578}`
        })
        
        this.setState({ hex, balance })
      }
    );

  }

  async getBalance(address) {
    let utxos = [], balance = 0
    try {
      utxos = await getUtxo({ address: address });
    } catch (e) {
      console.log(e)
      alert('Provider not reachable.');
    }

    utxos.forEach(utxo => {
      balance += utxo.value;
    });

    return { balance, utxos };
  }

  startWatching(address, interval, callback) {
    const that = this;
    this.watcher = setInterval(() => {
      this.getBalance(address)
        .then(({ balance, utxos }) => {
          if (balance > 0) {
            //stop interval
            clearInterval(that.watcher);
            //execute the payment
            callback(balance, utxos);
          }
        })
        .catch(console.error)
    }, interval)
  }


  render() {
    const { address, balance, hex, txId } = this.state;
    return <section>
      <div className="container">
        <div className="content">
          <div className="box">
            <p className="title is-4">
              Liquid Address
            </p>

            <p className="subtitle is-6">
              {address}
            </p>
            <QRCode value={address} />
          </div>
          <div className="box">
            <p className="title is-4">
              Balance
            </p>

            <p className="subtitle is-6">
              {balance}
            </p>
          </div>

          {
            txId && <div className="notification is-success">
              {`Success! ${txId}` }
            </div>
          }
          {hex && <div className="box">
            <p className="title is-4">
              Signed Transaction
            </p>

            <p className="subtitle is-6">
              {hex}
            </p>

            <button className="button" onClick={async () => {
              try {
                const txId = await broadcast({ hex })
                this.setState({ txId })
              } catch(e) {
                console.error(e);
                alert('Error when broadcasting');
              }
            }}> Broadcast 🚀 </button>
          </div>}
        </div>
      </div>
      {`\n`}
    </section>;
  }
}

export default App;
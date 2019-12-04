import React, { Component } from "react";
import liquid from "liquid-js";
import { ECPair } from "bitcoinjs-lib";

import QRCode from 'qrcode.react';

import { getUtxo } from "./utils";

class App extends Component {

  constructor() {
    super();
    this.state = { address: "", balance:0 }
  }
  componentDidMount() {
    //const pubkey = Buffer.from("0228ac32c2f6724fc865aa51f5aeb246c5c5cda42bdfd2430a201696aa0ccc541d", 'hex');
    const keyPair = ECPair.makeRandom();
    const address = liquid.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: liquid.networks.regtest
    });


    this.startWatching(
      address,
      5000,
      (balance) => this.setState({ balance })
    );
    this.setState({ address });
  }

  async getBalance(address) {
    let utxos = [], balance = 0
    try {
      utxos = await getUtxo({ address: address });
    } catch (e) {
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
        .then(({ balance }) => {
          if (balance > 0) {
            //stop interval
            clearInterval(that.watcher);
            //execute the payment
            callback(balance);
          }
        })
        .catch(console.error)
    }, interval)
  }


  render() {
    const { address, balance } = this.state;
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
        </div>
      </div>
      {`\n`}
    </section>;
  }
}

export default App;
import coinSelect from 'coinselect';
import { TransactionBuilder, payments } from "liquidjs-lib";


const isNode = new Function("try {return this===global;}catch(e){return false;}");
const fetch = isNode ? require('node-fetch') : window.fetch;

const BASE_API = "https://regtest.vulpem.com/liquid/api";

function getUtxo({ baseApi, address }) {
  if (!baseApi)
    baseApi = BASE_API;

  return fetch(`${baseApi}/address/${address}/utxo`).then(r => r.json())
}

async function faucet({address, baseApi}) {
  if (!baseApi)
    baseApi = BASE_API;

  return fetch(`${baseApi}/faucet`, {
    method: 'POST',
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({address})
  })
}  

async function broadcast({baseApi, hex}) {
  if (!baseApi)
    baseApi = BASE_API;

  return fetch(`${baseApi}/tx`, {
    method: 'POST',
    body: hex
  }).then(r => r.text())
}  


function buildAndSignTransaction({ from, utxos, to, amount, keyPair, payload, network }) {

  // OP_RETUR stuff
  const data = Buffer.from(payload, 'utf8');
  const embed = payments.embed({ data: [data] });

  //Liquid Bitcoin asset hash 
  const reversedAssetHash = reverseBuffer(Buffer.from(network.assetHash, 'hex'))
  // 0x01 stands for unblinded assets
  const assetBuffer = Buffer.from([0x01, ...reversedAssetHash]);

  const { inputs, outputs, fee } = coinSelection({
    ins: utxos,
    outs: [
      //Let's send Liquid Bitcoins to merchant
      { address: to, value: amount },
      //Lets' write a payload into the chain
      {script: embed.output, value:0 }
    ],
    changeOutput: from,
    feePerByte: 1
  });

  const tx = new TransactionBuilder(network)
  inputs.forEach(unspent => tx.addInput(unspent.txid, unspent.vout));
  outputs.forEach(output => tx.addOutput(assetBuffer, output.value, '00', output.address || output.script)); // the actual "spend"
  //add the fee as asset because Liquid unlike Bitcoin has the fee as an explicit output
  tx.addOutput(assetBuffer, fee, '00', Buffer.from(new ArrayBuffer(0)));

  inputs.forEach((_,index) => tx.sign(index, keyPair));

  const hex = tx.build().toHex();
  if (!hex)
    throw 'Building transaction error';

  return hex;
}

function coinSelection({ ins, outs, changeOutput, feePerByte }) {
  const minRelayFee = 200;

  let obj = {};
  let { inputs, outputs, fee } = coinSelect(ins, outs, feePerByte);

  // .inputs and .outputs will be undefined if no solution was found
  if (!inputs || !outputs)
    throw "No solution found";

  obj.fee = fee + minRelayFee;
  obj.inputs = inputs.map(i => ({ txid: i.txid, vout: i.vout, value: i.value }));
  obj.outputs = outputs.map(o => {
    // watch out, change outputs may have been added that you need to provide
    // an output address/script for
    if (!o.address && !o.script) {
      o.value = o.value - minRelayFee
      o.address = changeOutput;
    }

    return o;
  });

  return obj;
}


function reverseBuffer(buffer) {
  if (buffer.length < 1) return buffer;
  let j = buffer.length - 1;
  let tmp = 0;
  for (let i = 0; i < buffer.length / 2; i++) {
    tmp = buffer[i];
    buffer[i] = buffer[j];
    buffer[j] = tmp;
    j--;
  }
  return buffer;
}

export { getUtxo, faucet, buildAndSignTransaction, broadcast }

const isNode = new Function("try {return this===global;}catch(e){return false;}");
const fetch = isNode ? require('node-fetch') : window.fetch;

const BASE_API = "https://regtest.vulpem.com/liquid/api";

function getUtxo({ baseApi, address }) {
  if (!baseApi)
    baseApi = BASE_API;

  return fetch(`${baseApi}/address/${address}/utxo`).then(r => r.json())
}

export { getUtxo }
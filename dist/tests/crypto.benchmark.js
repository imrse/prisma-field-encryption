"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = __importDefault(require("node:crypto"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_perf_hooks_1 = require("node:perf_hooks");
function hashSync(input) {
    const hash = node_crypto_1.default.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}
function hashNode(input) {
    const hash = node_crypto_1.default.createHash('sha256');
    hash.update(input);
    return Promise.resolve(hash.digest('hex'));
}
async function hashWebCrypto(input) {
    const utf8 = new TextEncoder();
    const hash = await node_crypto_1.default.subtle.digest('SHA-256', utf8.encode(input));
    return Buffer.from(hash).toString('hex');
}
async function compute(input) {
    // JIT warmup
    hashSync(input);
    await hashNode(input);
    await hashWebCrypto(input);
    const RUNS = 10000;
    let syncTime = 0;
    let nodeTime = 0;
    let webCryptoTime = 0;
    for (let i = 0; i < RUNS; ++i) {
        const tick = node_perf_hooks_1.performance.now();
        hashSync(input);
        const tack = node_perf_hooks_1.performance.now();
        await hashNode(input);
        const tock = node_perf_hooks_1.performance.now();
        await hashWebCrypto(input);
        const tuck = node_perf_hooks_1.performance.now();
        syncTime += tack - tick;
        nodeTime += tock - tack;
        webCryptoTime += tuck - tock;
    }
    return {
        node: nodeTime / RUNS,
        webCrypto: webCryptoTime / RUNS,
        sync: syncTime / RUNS
    };
}
async function main() {
    const empty = await compute('');
    console.dir({ empty });
    const small = await compute('hello, world');
    console.dir({ small });
    const medium = await compute("const hash = await crypto.subtle.digest('SHA-256', utf8.encode(input))");
    console.dir({ medium });
    const large = await compute(`A Elbereth Gilthoniel
  silivren penna míriel
  o menel aglar elenath!
  Na-chaered palan-díriel
  o galadhremmin ennorath,
  Fanuilos, le linnathon
  nef aear, sí nef aearon!

  A Elbereth Gilthoniel
  o menel palan-diriel,
  le nallon sí di'nguruthos!
  A tiro nin, Fanuilos!`);
    console.dir({ large });
    const hugeString = await promises_1.default.readFile('./src/tests/.generated/client/index.d.ts', 'utf-8');
    const huge = await compute(hugeString);
    console.dir({ huge });
}
main();

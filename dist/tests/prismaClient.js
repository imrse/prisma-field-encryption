"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeExtensionClient = exports.makeMiddlewareClient = void 0;
const index_1 = require("../index");
const client_1 = require("./.generated/client");
const TEST_ENCRYPTION_KEY = 'k1.aesgcm256.__________________________________________8=';
const config = {
    encryptionKey: TEST_ENCRYPTION_KEY,
    dmmf: client_1.Prisma.dmmf
};
function makeMiddlewareClient() {
    const client = new client_1.PrismaClient();
    client.$use((0, index_1.fieldEncryptionMiddleware)(config));
    return client;
}
exports.makeMiddlewareClient = makeMiddlewareClient;
function makeExtensionClient() {
    const client = new client_1.PrismaClient();
    return client.$extends((0, index_1.fieldEncryptionExtension)(config));
}
exports.makeExtensionClient = makeExtensionClient;

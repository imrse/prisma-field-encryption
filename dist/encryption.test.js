"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const key_1 = require("@47ng/cloak/dist/key");
const encryption_1 = require("./encryption");
const errors_1 = require("./errors");
const TEST_KEY = 'k1.aesgcm256.DbQoar8ZLuUsOHZNyrnjlskInHDYlzF3q6y1KGM7DUM=';
describe('encryption', () => {
    describe('configureKeys', () => {
        test('No encryption key specified', () => {
            const run = () => (0, encryption_1.configureKeys)({});
            expect(run).toThrowError(errors_1.errors.noEncryptionKey);
        });
        test('Providing encryptionKey directly', () => {
            const { encryptionKey } = (0, encryption_1.configureKeys)({
                encryptionKey: TEST_KEY
            });
            expect((0, key_1.formatKey)(encryptionKey.raw)).toEqual(TEST_KEY);
        });
        test('Providing encryptionKey via the environment', () => {
            process.env.PRISMA_FIELD_ENCRYPTION_KEY = TEST_KEY;
            const { encryptionKey } = (0, encryption_1.configureKeys)({});
            expect((0, key_1.formatKey)(encryptionKey.raw)).toEqual(TEST_KEY);
            process.env.PRISMA_FIELD_ENCRYPTION_KEY = undefined;
        });
        test('Encryption key is in the keychain', () => {
            const { encryptionKey, keychain } = (0, encryption_1.configureKeys)({
                encryptionKey: TEST_KEY
            });
            expect(keychain[encryptionKey.fingerprint].key).toEqual(encryptionKey);
        });
        test('Loading decryption keys directly', () => {
            const { keychain } = (0, encryption_1.configureKeys)({
                encryptionKey: TEST_KEY,
                decryptionKeys: [
                    'k1.aesgcm256.4BNYdJnjOQJP2adq9cGM9kb4dZxDujUs6aPS0VeRtAM=',
                    'k1.aesgcm256.El9unG7WBAVRQdATOyMggE3XrLV2ZjTGKdajfmIeBPs='
                ]
            });
            expect(Object.values(keychain).length).toEqual(3);
        });
        test('Loading decryption keys via the environment', () => {
            process.env.PRISMA_FIELD_DECRYPTION_KEYS = [
                'k1.aesgcm256.4BNYdJnjOQJP2adq9cGM9kb4dZxDujUs6aPS0VeRtAM=',
                'k1.aesgcm256.El9unG7WBAVRQdATOyMggE3XrLV2ZjTGKdajfmIeBPs='
            ].join(',');
            const { keychain } = (0, encryption_1.configureKeys)({
                encryptionKey: TEST_KEY
            });
            expect(Object.values(keychain).length).toEqual(3);
            process.env.PRISMA_FIELD_DECRYPTION_KEYS = undefined;
        });
    });
});

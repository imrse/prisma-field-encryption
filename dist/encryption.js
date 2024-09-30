"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptOnRead = exports.encryptOnWrite = exports.configureKeys = void 0;
const cloak_1 = require("@47ng/cloak");
const immer_1 = require("immer");
const object_path_1 = __importDefault(require("object-path"));
const debugger_1 = require("./debugger");
const errors_1 = require("./errors");
const hash_1 = require("./hash");
const visitor_1 = require("./visitor");
function configureKeys(config) {
    var _a, _b;
    const encryptionKey = config.encryptionKey || process.env.PRISMA_FIELD_ENCRYPTION_KEY;
    if (!encryptionKey) {
        throw new Error(errors_1.errors.noEncryptionKey);
    }
    const decryptionKeysFromEnv = ((_a = process.env.PRISMA_FIELD_DECRYPTION_KEYS) !== null && _a !== void 0 ? _a : '')
        .split(',')
        .filter(Boolean);
    const decryptionKeys = Array.from(new Set([
        encryptionKey,
        ...((_b = config.decryptionKeys) !== null && _b !== void 0 ? _b : decryptionKeysFromEnv)
    ]));
    const keychain = (0, cloak_1.makeKeychainSync)(decryptionKeys);
    return {
        encryptionKey: (0, cloak_1.parseKeySync)(encryptionKey),
        keychain
    };
}
exports.configureKeys = configureKeys;
// --
function encryptOnWrite(params, keys, models, operation, customEncryptor, customHasher) {
    debugger_1.debug.encryption('Clear-text input: %O', params);
    const encryptionErrors = [];
    const mutatedParams = (0, immer_1.produce)(params, (draft) => {
        (0, visitor_1.visitInputTargetFields)(draft, models, function encryptFieldValue({ fieldConfig, value: clearText, path, model, field }) {
            var _a, _b;
            const hashedPath = rewriteHashedFieldPath(path, field, (_b = (_a = fieldConfig.hash) === null || _a === void 0 ? void 0 : _a.targetField) !== null && _b !== void 0 ? _b : field + 'Hash');
            if (hashedPath) {
                if (!fieldConfig.hash) {
                    console.warn(errors_1.warnings.whereConnectClauseNoHash(operation, path));
                }
                else {
                    const normalized = (0, hash_1.normalizeHashString)(clearText, fieldConfig.hash.normalize);
                    const hash = customHasher ? customHasher(normalized, fieldConfig.hash, model, field, keys) : (0, hash_1.hashString)(normalized, fieldConfig.hash);
                    debugger_1.debug.encryption(`Swapping encrypted search of ${model}.${field} with hash search under ${fieldConfig.hash.targetField} (hash: ${hash})`);
                    object_path_1.default.del(draft.args, path);
                    object_path_1.default.set(draft.args, hashedPath, hash);
                    return;
                }
            }
            if (isOrderBy(path, field, clearText)) {
                // Remove unsupported orderBy clause on encrypted text
                // (makes no sense to sort ciphertext nor to encrypt 'asc' | 'desc')
                console.error(errors_1.errors.orderByUnsupported(model, field));
                debugger_1.debug.encryption(`Removing orderBy clause on ${model}.${field} at path \`${path}: ${clearText}\``);
                object_path_1.default.del(draft.args, path);
                return;
            }
            if (!fieldConfig.encrypt) {
                return;
            }
            try {
                const encryptor = customEncryptor || defaultEncryptor;
                const cipherText = encryptor(clearText, model, field, keys);
                object_path_1.default.set(draft.args, path, cipherText);
                debugger_1.debug.encryption(`Encrypted ${model}.${field} at path \`${path}\``);
                if (fieldConfig.hash) {
                    const normalized = (0, hash_1.normalizeHashString)(clearText, fieldConfig.hash.normalize);
                    const hash = customHasher ? customHasher(normalized, fieldConfig.hash, model, field, keys) : (0, hash_1.hashString)(normalized, fieldConfig.hash);
                    const hashPath = rewriteWritePath(path, field, fieldConfig.hash.targetField);
                    object_path_1.default.set(draft.args, hashPath, hash);
                    debugger_1.debug.encryption(`Added hash ${hash} of ${model}.${field} under ${fieldConfig.hash.targetField}`);
                }
            }
            catch (error) {
                encryptionErrors.push(errors_1.errors.fieldEncryptionError(model, field, path, error));
            }
        });
    });
    if (encryptionErrors.length > 0) {
        throw new Error(errors_1.errors.encryptionErrorReport(operation, encryptionErrors));
    }
    debugger_1.debug.encryption('Encrypted input: %O', mutatedParams);
    return mutatedParams;
}
exports.encryptOnWrite = encryptOnWrite;
function decryptOnRead(params, result, keys, models, operation, customDecryptor) {
    var _a, _b;
    // Analyse the query to see if there's anything to decrypt.
    const model = models[params.model];
    if (Object.keys(model.fields).length === 0 &&
        !((_a = params.args) === null || _a === void 0 ? void 0 : _a.include) &&
        !((_b = params.args) === null || _b === void 0 ? void 0 : _b.select)) {
        // The queried model doesn't have any encrypted field,
        // and there are no included connections.
        // We can safely skip decryption for the returned data.
        // todo: Walk the include/select tree for a better decision.
        debugger_1.debug.decryption(`Skipping decryption: ${params.model} has no encrypted field and no connection was included`);
        return;
    }
    debugger_1.debug.decryption('Raw result from database: %O', result);
    const decryptionErrors = [];
    const fatalDecryptionErrors = [];
    (0, visitor_1.visitOutputTargetFields)(params, result, models, function decryptFieldValue({ fieldConfig, value: cipherText, path, model, field }) {
        try {
            const decryptor = customDecryptor || defaultDecryptor;
            const clearText = decryptor(cipherText, model, field, keys);
            if (clearText === undefined) {
                return;
            }
            object_path_1.default.set(result, path, clearText);
            debugger_1.debug.decryption(`Decrypted ${model}.${field} at path \`${path}\``);
        }
        catch (error) {
            const message = errors_1.errors.fieldDecryptionError(model, field, path, error);
            if (fieldConfig.strictDecryption) {
                fatalDecryptionErrors.push(message);
            }
            else {
                decryptionErrors.push(message);
            }
        }
    });
    if (decryptionErrors.length > 0) {
        console.error(errors_1.errors.decryptionErrorReport(operation, decryptionErrors));
    }
    if (fatalDecryptionErrors.length > 0) {
        throw new Error(errors_1.errors.decryptionErrorReport(operation, fatalDecryptionErrors));
    }
    debugger_1.debug.decryption('Decrypted result: %O', result);
}
exports.decryptOnRead = decryptOnRead;
function rewriteHashedFieldPath(path, field, hashField) {
    const items = path.split('.').reverse();
    // Special case for `where field equals or not` clause
    if (items.includes('where') && items[1] === field && ['equals', 'not'].includes(items[0])) {
        items[1] = hashField;
        return items.reverse().join('.');
    }
    const clauses = ['where', 'connect', 'cursor'];
    for (const clause of clauses) {
        if (items.includes(clause) && items[0] === field) {
            items[0] = hashField;
            return items.reverse().join('.');
        }
    }
    return null;
}
function defaultEncryptor(clearText, model, field, keys) {
    return (0, cloak_1.encryptStringSync)(clearText, keys.encryptionKey);
}
function defaultDecryptor(cipherText, model, field, keys) {
    if (!(0, cloak_1.parseCloakedString)(cipherText)) {
        return;
    }
    const decryptionKey = (0, cloak_1.findKeyForMessage)(cipherText, keys.keychain);
    return (0, cloak_1.decryptStringSync)(cipherText, decryptionKey);
}
function rewriteWritePath(path, field, hashField) {
    const items = path.split('.').reverse();
    if (items[0] === field) {
        items[0] = hashField;
    }
    else if (items[0] === 'set' && items[1] === field) {
        items[1] = hashField;
    }
    return items.reverse().join('.');
}
function isOrderBy(path, field, value) {
    const items = path.split('.').reverse();
    return (items.includes('orderBy') &&
        items[0] === field &&
        ['asc', 'desc'].includes(value.toLowerCase()));
}

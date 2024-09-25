"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldEncryptionExtension = void 0;
const extension_1 = require("@prisma/client/extension");
const debugger_1 = require("./debugger");
const dmmf_1 = require("./dmmf");
const encryption_1 = require("./encryption");
function fieldEncryptionExtension(config = {}) {
    var _a;
    const keys = (0, encryption_1.configureKeys)(config);
    const customEncryptor = config.encryptor;
    const customDecryptor = config.decryptor;
    const customHasher = config.hasher;
    debugger_1.debug.setup('Keys: %O', keys);
    const models = (0, dmmf_1.analyseDMMF)((_a = config.dmmf) !== null && _a !== void 0 ? _a : require('@prisma/client').Prisma.dmmf);
    debugger_1.debug.setup('Models: %O', models);
    return extension_1.Prisma.defineExtension({
        name: 'prisma-field-encryption',
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    if (!model) {
                        // Unsupported operation
                        debugger_1.debug.runtime('Unsupported operation %s (missing model): %O', operation, args);
                        return await query(args);
                    }
                    const params = {
                        args,
                        model: model,
                        action: operation,
                        dataPath: [],
                        runInTransaction: false
                    };
                    const encryptedParams = (0, encryption_1.encryptOnWrite)(params, keys, models, operation, customEncryptor, customHasher);
                    let result = await query(encryptedParams.args);
                    (0, encryption_1.decryptOnRead)(encryptedParams, result, keys, models, operation, customDecryptor);
                    return result;
                }
            }
        }
    });
}
exports.fieldEncryptionExtension = fieldEncryptionExtension;

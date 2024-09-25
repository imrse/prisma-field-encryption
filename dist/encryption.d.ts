import { CloakKeychain, ParsedCloakKey } from '@47ng/cloak';
import type { DMMFModels } from './dmmf';
import type { Configuration, MiddlewareParams } from './types';
import { HashFieldConfiguration } from './types';
export interface KeysConfiguration {
    encryptionKey: ParsedCloakKey;
    keychain: CloakKeychain;
}
export declare function configureKeys(config: Configuration): KeysConfiguration;
export declare function encryptOnWrite<Models extends string, Actions extends string>(params: MiddlewareParams<Models, Actions>, keys: KeysConfiguration, models: DMMFModels, operation: string, customEncryptor?: (clearText: string, model: string, field: string, keys: KeysConfiguration) => string | undefined, customHasher?: (clearText: string, hashConfig: Omit<HashFieldConfiguration, 'sourceField'>, model: string, field: string, keys: KeysConfiguration) => string | undefined): MiddlewareParams<Models, Actions>;
export declare function decryptOnRead<Models extends string, Actions extends string>(params: MiddlewareParams<Models, Actions>, result: any, keys: KeysConfiguration, models: DMMFModels, operation: string, customDecryptor?: (cipherText: string, model: string, field: string, keys: KeysConfiguration) => string | undefined): void;

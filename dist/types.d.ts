/**
 * Prisma types --
 *
 * We're copying just what we need for local type safety
 * without importing Prisma-generated types, as the location
 * of the generated client can be unknown (when using custom
 * or multiple client locations).
 */
import type { Encoding } from '@47ng/codec';
import type { KeysConfiguration } from './encryption';
import { z } from 'zod';
/**
 * Not ideal to use `any` on model & action, but Prisma's
 * strong typing there actually prevents using the correct
 * type without excessive generics wizardry.
 */
export type MiddlewareParams<Models extends string, Actions extends string> = {
    model?: Models;
    action: Actions;
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
};
export type Middleware<Models extends string, Actions extends string, Result = any> = (params: MiddlewareParams<Models, Actions>, next: (params: MiddlewareParams<Models, Actions>) => Promise<Result>) => Promise<Result>;
declare const dmmfFieldParser: z.ZodReadonly<z.ZodObject<{
    name: z.ZodString;
    isList: z.ZodBoolean;
    isUnique: z.ZodBoolean;
    isId: z.ZodBoolean;
    type: z.ZodAny;
    documentation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isList: boolean;
    isUnique: boolean;
    isId: boolean;
    type?: any;
    documentation?: string | undefined;
}, {
    name: string;
    isList: boolean;
    isUnique: boolean;
    isId: boolean;
    type?: any;
    documentation?: string | undefined;
}>>;
declare const dmmfModelParser: z.ZodReadonly<z.ZodObject<{
    name: z.ZodString;
    fields: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
        name: z.ZodString;
        isList: z.ZodBoolean;
        isUnique: z.ZodBoolean;
        isId: z.ZodBoolean;
        type: z.ZodAny;
        documentation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        isList: boolean;
        isUnique: boolean;
        isId: boolean;
        type?: any;
        documentation?: string | undefined;
    }, {
        name: string;
        isList: boolean;
        isUnique: boolean;
        isId: boolean;
        type?: any;
        documentation?: string | undefined;
    }>>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    fields: readonly Readonly<{
        name: string;
        isList: boolean;
        isUnique: boolean;
        isId: boolean;
        type?: any;
        documentation?: string | undefined;
    }>[];
}, {
    name: string;
    fields: {
        name: string;
        isList: boolean;
        isUnique: boolean;
        isId: boolean;
        type?: any;
        documentation?: string | undefined;
    }[];
}>>;
export declare const dmmfDocumentParser: z.ZodReadonly<z.ZodObject<{
    datamodel: z.ZodReadonly<z.ZodObject<{
        models: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
            name: z.ZodString;
            fields: z.ZodReadonly<z.ZodArray<z.ZodReadonly<z.ZodObject<{
                name: z.ZodString;
                isList: z.ZodBoolean;
                isUnique: z.ZodBoolean;
                isId: z.ZodBoolean;
                type: z.ZodAny;
                documentation: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }, {
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }>>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            fields: readonly Readonly<{
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }>[];
        }, {
            name: string;
            fields: {
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }[];
        }>>, "many">>;
    }, "strip", z.ZodTypeAny, {
        models: readonly Readonly<{
            name: string;
            fields: readonly Readonly<{
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }>[];
        }>[];
    }, {
        models: {
            name: string;
            fields: {
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }[];
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    datamodel: Readonly<{
        models: readonly Readonly<{
            name: string;
            fields: readonly Readonly<{
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }>[];
        }>[];
    }>;
}, {
    datamodel: {
        models: {
            name: string;
            fields: {
                name: string;
                isList: boolean;
                isUnique: boolean;
                isId: boolean;
                type?: any;
                documentation?: string | undefined;
            }[];
        }[];
    };
}>>;
export type DMMFModel = z.TypeOf<typeof dmmfModelParser>;
export type DMMFField = z.TypeOf<typeof dmmfFieldParser>;
export type DMMFDocument = z.TypeOf<typeof dmmfDocumentParser>;
export interface Configuration {
    encryptionKey?: string;
    decryptionKeys?: string[];
    decryptor?: (cipherText: string, model: string, field: string, keys: KeysConfiguration) => string | undefined;
    encryptor?: (clearText: string, model: string, field: string, keys: KeysConfiguration) => string | undefined;
    hasher?: (clearText: string, hashConfig: Omit<HashFieldConfiguration, 'sourceField'>, model: string, field: string, keys: KeysConfiguration) => string | undefined;
    dmmf?: Readonly<DMMFDocument>;
}
export type HashFieldConfiguration = {
    sourceField: string;
    targetField: string;
    algorithm: string;
    salt?: string;
    inputEncoding: Encoding;
    outputEncoding: Encoding;
    normalize?: HashFieldNormalizeOptions[];
};
export declare enum HashFieldNormalizeOptions {
    lowercase = "lowercase",
    uppercase = "uppercase",
    trim = "trim",
    spaces = "spaces",
    diacritics = "diacritics"
}
export interface FieldConfiguration {
    encrypt: boolean;
    strictDecryption: boolean;
    hash?: Omit<HashFieldConfiguration, 'sourceField'>;
}
export {};

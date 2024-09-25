"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const path_1 = __importDefault(require("path"));
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
async function openDatabase() {
    return (0, sqlite_1.open)({
        filename: path_1.default.resolve(__dirname, '../../prisma/db.integration.sqlite'),
        driver: sqlite3_1.default.Database
    });
}
async function get({ table, where = {} }) {
    const whereFields = Object.keys(where !== null && where !== void 0 ? where : {});
    const whereQuery = whereFields
        .map(field => `${field} = :${field}`)
        .join(' and ');
    const query = `select * from ${table}${whereFields.length ? ` where ${whereQuery}` : ''}`;
    const args = whereFields.reduce((args, field) => ({
        ...args,
        [`:${field}`]: where[field]
    }), {});
    const db = await openDatabase();
    const result = await db.get(query, args);
    await db.close();
    return result;
}
exports.get = get;

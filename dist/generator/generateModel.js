"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModel = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
async function generateModel({ modelName, model, prismaClientModule, outputDir }) {
    const fields = Object.keys(model.fields);
    const interfaceName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1);
    const content = `// This file was generated by prisma-field-encryption.

import type { PrismaClient, ${modelName} } from '${prismaClientModule}'
import {
  ProgressReportCallback,
  defaultProgressReport,
  visitRecords
} from 'prisma-field-encryption/dist/generator/runtime'

type Cursor = ${modelName}['${model.cursor}']

export async function migrate(
  client: PrismaClient,
  reportProgress: ProgressReportCallback = defaultProgressReport
): Promise<number> {
  return visitRecords<PrismaClient, Cursor>({
    modelName: '${modelName}',
    client,
    getTotalCount: client.${interfaceName}.count,
    migrateRecord,
    reportProgress,
  })
}

async function migrateRecord(client: PrismaClient, cursor: Cursor | undefined) {
  return await client.$transaction(async tx => {
    const record = await tx.${interfaceName}.findFirst({
      take: 1,
      skip: cursor === undefined ? undefined : 1,
      ...(cursor === undefined
        ? {}
        : {
            cursor: {
              ${model.cursor}: cursor
            }
          }),
      orderBy: {
        ${model.cursor}: 'asc'
      },
      select: {
        ${model.cursor}: true,
        ${fields.map(field => `${field}: true`).join(',\n        ')}
      }
    })
    if (!record) {
      return cursor
    }
    await tx.${interfaceName}.update({
      where: {
        ${model.cursor}: record.${model.cursor}
      },
      data: {
        ${fields.map(field => `${field}: record.${field}`).join(',\n        ')}
      }
    })
    return record.${model.cursor}
  })
}

/**
 * Internal model:
 * ${JSON.stringify(model, null, 2).split('\n').join('\n * ')}
 */
`;
    const outputPath = node_path_1.default.join(outputDir, `${modelName}.ts`);
    return promises_1.default.writeFile(outputPath, content);
}
exports.generateModel = generateModel;

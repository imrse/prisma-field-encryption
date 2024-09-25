"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloak_1 = require("@47ng/cloak");
const node_crypto_1 = require("node:crypto");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const errors_1 = require("../errors");
const prismaClient_1 = require("./prismaClient");
const sqlite = __importStar(require("./sqlite"));
const clients = [
    { type: 'middleware', client: (0, prismaClient_1.makeMiddlewareClient)() },
    { type: 'extension', client: (0, prismaClient_1.makeExtensionClient)() }
];
describe.each(clients)('integration ($type)', ({ client }) => {
    beforeAll(() => {
        // Reset database
        const src = node_path_1.default.resolve(process.cwd(), 'prisma', 'db.test.sqlite');
        const dst = node_path_1.default.resolve(process.cwd(), 'prisma', 'db.integration.sqlite');
        return promises_1.default.copyFile(src, dst);
    });
    const email = '007@hmss.gov.uk';
    test('create user', async () => {
        const received = await client.user.create({
            data: {
                email,
                name: 'James Bond'
            }
        });
        const dbValue = await sqlite.get({ table: 'User', where: { email } });
        expect(received.name).toEqual('James Bond'); // clear text in returned value
        expect(dbValue.name).toMatch(cloak_1.cloakedStringRegex); // encrypted in database
    });
    test('query user by encrypted field', async () => {
        let received = await client.user.findFirst({
            where: {
                name: 'James Bond'
            }
        });
        expect(received.name).toEqual('James Bond');
        // Should also work with long form:
        received = await client.user.findFirst({
            where: {
                name: {
                    equals: 'James Bond'
                }
            }
        });
        expect(received.name).toEqual('James Bond');
        // Should also work with boolean logic:
        received = await client.user.findFirst({
            where: {
                OR: [
                    {
                        name: 'James Bond'
                    },
                    {
                        name: 'Bond, James Bond.'
                    }
                ]
            }
        });
        expect(received.name).toEqual('James Bond');
    });
    test('query user by encrypted field (with equals)', async () => {
        const received = await client.user.findFirst({
            where: {
                name: {
                    equals: 'James Bond'
                }
            }
        });
        expect(received.name).toEqual('James Bond');
    });
    test('query user by encrypted field with complex query', async () => {
        const received = await client.user.findFirst({
            where: {
                OR: [
                    {
                        name: {
                            equals: 'James Bond'
                        }
                    },
                    {
                        AND: [
                            {
                                NOT: {
                                    name: 'Dr. No'
                                }
                            }
                        ]
                    }
                ]
            }
        });
        expect(received.name).toEqual('James Bond');
    });
    test('delete user', async () => {
        const received = await client.user.delete({ where: { email } });
        expect(received.name).toEqual('James Bond');
    });
    test('create post & associated user', async () => {
        var _a;
        const received = await client.post.create({
            data: {
                title: "I'm back",
                content: 'You only live twice.',
                author: {
                    create: {
                        email,
                        name: 'James Bond'
                    }
                }
            },
            select: {
                id: true,
                author: true,
                content: true
            }
        });
        const user = await sqlite.get({ table: 'User', where: { email } });
        const post = await sqlite.get({
            table: 'Post',
            where: { id: received.id.toString() }
        });
        expect((_a = received.author) === null || _a === void 0 ? void 0 : _a.name).toEqual('James Bond');
        expect(received.content).toEqual('You only live twice.');
        expect(user.name).toMatch(cloak_1.cloakedStringRegex);
        expect(post.content).toMatch(cloak_1.cloakedStringRegex);
        expect(post.title).toEqual("I'm back"); // clear text in the database
    });
    test('update user', async () => {
        const received = await client.user.update({
            data: {
                name: 'The name is Bond...'
            },
            where: {
                email
            }
        });
        const user = await sqlite.get({ table: 'User', where: { email } });
        expect(received.name).toEqual('The name is Bond...');
        expect(user.name).toMatch(cloak_1.cloakedStringRegex);
    });
    test('update user (with set)', async () => {
        const received = await client.user.update({
            data: {
                name: {
                    set: '...James Bond.'
                }
            },
            where: {
                email
            }
        });
        const user = await sqlite.get({ table: 'User', where: { email } });
        expect(received.name).toEqual('...James Bond.');
        expect(user.name).toMatch(cloak_1.cloakedStringRegex);
        await client.user.delete({
            where: {
                email
            }
        });
    });
    test('complex query nesting', async () => {
        const received = await client.user.create({
            data: {
                email: '006@hmss.gov.uk',
                name: 'Alec Trevelyan',
                posts: {
                    create: [
                        {
                            title: '006 - First report',
                            content: 'For England, James?'
                        },
                        {
                            title: 'Janus Quotes',
                            content: "I've set the timers for six minutes",
                            categories: {
                                create: {
                                    name: 'Quotes'
                                }
                            }
                        }
                    ]
                }
            },
            include: {
                posts: {
                    include: {
                        categories: true
                    }
                }
            }
        });
        expect(received.name).toEqual('Alec Trevelyan');
        expect(received.posts[0].content).toEqual('For England, James?');
        expect(received.posts[1].content).toEqual("I've set the timers for six minutes");
        const user = await sqlite.get({
            table: 'User',
            where: { email: '006@hmss.gov.uk' }
        });
        const post1 = await sqlite.get({
            table: 'Post',
            where: { id: received.posts[0].id.toString() }
        });
        const post2 = await sqlite.get({
            table: 'Post',
            where: { id: received.posts[1].id.toString() }
        });
        const category = await sqlite.get({
            table: 'Category',
            where: { name: 'Quotes' }
        });
        expect(user.name).toMatch(cloak_1.cloakedStringRegex);
        expect(post1.content).toMatch(cloak_1.cloakedStringRegex);
        expect(post2.content).toMatch(cloak_1.cloakedStringRegex);
        expect(category.name).toEqual('Quotes');
    });
    test('top level with no encrypted field, nested with encrypted field - using select', async () => {
        const created = await client.post.create({
            data: {
                title: "I'm back",
                content: 'You only live twice.',
                categories: {
                    create: {
                        name: 'Secret agents'
                    }
                },
                author: {
                    create: {
                        email,
                        name: 'James Bond'
                    }
                }
            },
            select: {
                id: true,
                author: true,
                content: true,
                categories: true
            }
        });
        const category = await client.category.findFirst({
            select: {
                name: true,
                posts: {
                    select: {
                        content: true
                    }
                }
            },
            where: {
                id: { equals: created.categories[0].id }
            }
        });
        expect(category === null || category === void 0 ? void 0 : category.name).toEqual('Secret agents');
        expect(category === null || category === void 0 ? void 0 : category.posts[0].content).toEqual('You only live twice.');
    });
    test('immutable params', async () => {
        const email = 'xenia@cccp.ru';
        const params = {
            data: {
                name: 'Xenia Onatop',
                email
            }
        };
        const received = await client.user.create(params);
        const user = await sqlite.get({ table: 'User', where: { email } });
        expect(params.data.name).toEqual('Xenia Onatop');
        expect(received.name).toEqual('Xenia Onatop');
        expect(user.name).toMatch(cloak_1.cloakedStringRegex);
    });
    test('orderBy is not supported', async () => {
        const cer = console.error;
        console.error = jest.fn();
        let received = await client.user.findMany({
            orderBy: {
                name: 'desc'
            }
        });
        expect(received.length).toEqual(3);
        // If 'desc' order was respected, those should be the other way around.
        // This test verifies that the directive is dropped and natural order
        // is preserved.
        expect(received[0].name).toEqual('Alec Trevelyan');
        expect(received[1].name).toEqual('James Bond');
        expect(received[2].name).toEqual('Xenia Onatop');
        expect(console.error).toHaveBeenLastCalledWith(errors_1.errors.orderByUnsupported('User', 'name'));
        // @ts-ignore
        console.error.mockClear();
        // Test array syntax
        received = await client.user.findMany({
            orderBy: [{ name: 'asc' }]
        });
        expect(received[0].name).toEqual('Alec Trevelyan');
        expect(received[1].name).toEqual('James Bond');
        expect(received[2].name).toEqual('Xenia Onatop');
        expect(console.error).toHaveBeenLastCalledWith(errors_1.errors.orderByUnsupported('User', 'name'));
        console.error = cer;
    });
    test('connect on hashed field', async () => {
        var _a;
        const content = 'You can connect to a hashed encrypted field.';
        const received = await client.post.create({
            data: {
                title: 'Connected',
                content,
                author: {
                    connect: {
                        name: 'James Bond'
                    }
                }
            },
            include: {
                author: true
            }
        });
        expect((_a = received.author) === null || _a === void 0 ? void 0 : _a.name).toEqual('James Bond');
        expect(received.content).toEqual(content);
    });
    test('cursor on hashed field', async () => {
        const received = await client.user.findMany({
            take: 1,
            cursor: {
                name: 'James Bond'
            }
        });
        expect(received[0].name).toEqual('James Bond');
    });
    test('transactions', async () => {
        const id = await client.$transaction(async (tx) => {
            const post = await tx.post.create({
                data: {
                    title: 'Mission orders',
                    author: {
                        connect: {
                            name: 'James Bond'
                        }
                    },
                    content: `This message will self-destruct in 5 seconds
              (oops, wrong spy show)`
                }
            });
            await tx.post.delete({ where: { id: post.id } });
            return post.id;
        });
        const post = await client.post.findUnique({ where: { id } });
        expect(post).toBeNull();
    });
    test('transactions with rollback', async () => {
        try {
            await client.$transaction(async (tx) => {
                const post = await tx.post.create({
                    data: {
                        title: 'Mission orders',
                        author: {
                            connect: {
                                name: 'James Bond'
                            }
                        },
                        content: `This message will self-destruct in 5 seconds
              (oops, wrong spy show)`
                    }
                });
                // Simulate a transaction failure to test rollback
                throw post.id;
            });
        }
        catch (id) {
            const post = await client.post.findUnique({ where: { id: id } });
            expect(post).toBeNull();
            return;
        }
        // Should be unreachable
        const reached = true;
        expect(reached).toBe(false);
    });
    test("Doesn't work with the Fluent API", async () => {
        const posts = await client.user.findUnique({ where: { email } }).posts();
        for (const post of posts) {
            expect(post.content).toMatch(cloak_1.cloakedStringRegex);
        }
    });
    test('query entries with non-empty name', async () => {
        const fakeName = 'f@keU$er';
        await client.user.create({
            data: {
                name: '',
                email: 'test_mail@example.com'
            }
        });
        const users = await client.user.findMany();
        // assume active user with nonempty name
        const activeUserCount = await client.user.count({
            where: { name: { not: '' } }
        });
        // use fakeName to pretend unique name
        const existingUsers = await client.user.findMany({
            where: { name: { not: fakeName } }
        });
        expect(activeUserCount).toBe(users.length - 1);
        expect(existingUsers).toEqual(users);
    });
    const normalizeTestEmail = 'normalize@example.com';
    test('create user with normalizeable name', async () => {
        const received = await client.user.create({
            data: {
                email: normalizeTestEmail,
                name: ' François'
            }
        });
        const dbValue = await sqlite.get({
            table: 'User',
            where: { email: normalizeTestEmail }
        });
        expect(received.name).toEqual(' François'); // clear text in returned value
        expect(dbValue.name).toMatch(cloak_1.cloakedStringRegex); // encrypted in database
    });
    test('query user by encrypted and hashed name field with a normalized input (with equals)', async () => {
        const received = await client.user.findFirst({
            where: {
                name: {
                    equals: 'Francois' //check for lowercase, trim and diacritics
                }
            }
        });
        expect(received.name).toEqual(' François'); // clear text in returned value
        expect(received.email).toEqual(normalizeTestEmail);
    });
    test('query field with 4 MiB+ data', async () => {
        var _a, _b;
        const longNameUser = {
            name: 'a'.repeat(4194304),
            email: 'mr-4MiB-name@example.test'
        };
        await client.user.upsert({
            where: {
                email: longNameUser.email
            },
            create: longNameUser,
            update: longNameUser
        });
        const savedUser = await client.user.findUniqueOrThrow({
            where: {
                email: longNameUser.email
            }
        });
        expect(savedUser.email).toStrictEqual(longNameUser.email);
        // The encrypted field is larger than the unencrypted field, so just comparing
        // the lengths is fine.
        expect((_a = savedUser.name) === null || _a === void 0 ? void 0 : _a.length).toStrictEqual(longNameUser.name.length);
        // Don't test for equality, otherwise we'd fill up the jest log with
        // a massive error message if something goes wrong.
        expect((0, node_crypto_1.createHash)('sha256')
            .update((_b = savedUser.name) !== null && _b !== void 0 ? _b : '')
            .digest('hex')).toStrictEqual((0, node_crypto_1.createHash)('sha256').update(longNameUser.name).digest('hex'));
    }, 15000); // storing 4 MiB into the DB is a bit slow
});

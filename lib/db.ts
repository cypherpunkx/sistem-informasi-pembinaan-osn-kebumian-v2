import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

type PoolType = ReturnType<typeof mysql.createPool>;
const _globalForDb = globalThis as unknown as { __dbPool?: PoolType };

const connection =
    _globalForDb.__dbPool ??
    (() => {
        const pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            connectionLimit: 5,
            waitForConnections: true,
            queueLimit: 0,
        });
        _globalForDb.__dbPool = pool;
        return pool;
    })();

export const db = drizzle(connection, { schema, mode: "default" });

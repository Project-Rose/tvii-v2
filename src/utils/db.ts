import knex from "knex";
import { env } from "../env.ts";

export const db = knex({
    client: "mysql2",
    connection: {
        host: env.VINO_JP_CONFIG_DB_HOST,
        port: env.VINO_JP_CONFIG_DB_PORT,
        user: env.VINO_JP_CONFIG_DB_USERNAME,
        password: env.VINO_JP_CONFIG_DB_PASSWORD,
        database: env.VINO_JP_CONFIG_DB_NAME,
        charset: "utf8mb4",
    },
});

export const db_whitelist = knex({
    client: "mysql2",
    connection: {
        host: env.VINO_JP_CONFIG_DB_HOST,
        port: env.VINO_JP_CONFIG_DB_PORT,
        user: env.VINO_JP_CONFIG_DB_USERNAME,
        password: env.VINO_JP_CONFIG_DB_PASSWORD,
        database: env.VINO_JP_CONFIG_WHITELIST_DB_NAME,
        charset: "utf8mb4",
    },
});

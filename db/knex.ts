// db/knex.ts
import "dotenv/config";
import knex from "knex";

export const TABLE = process.env.DB_TABLE;

export const db = knex({
  client: "sqlite3",
  connection: {
    filename: process.env.SQLITE_DB || 'jcrs.db'
  },
});

export const repodb = knex({
  client: "mysql2",
  connection: {
    host: process.env.REPO_DB_HOST || "127.0.0.1",
    port: Number(process.env.REPO_DB_PORT),
    user: process.env.REPO_DB_USER,
    password: process.env.REPO_DB_PASSWORD,
    database: process.env.REPO_DB_DATABASE || "jcrs_records",
  },
});


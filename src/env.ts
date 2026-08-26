import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Type-safe enviornment variables
export const env = createEnv({
  server: {
    VINO_JP_CONFIG_PORT: z.coerce.number().min(1).max(65535),
    VINO_JP_CONFIG_ENV: z.enum(["dev", "stg", "prod"]),
    VINO_JP_TOKEN_SECRET: z.string(),
    VINO_JP_SITE_URL: z.string(),
    VINO_JP_CONFIG_DB_HOST: z.string(),
    VINO_JP_CONFIG_DB_PORT: z.coerce.number().int().min(1).max(65535),
    VINO_JP_CONFIG_DB_USERNAME: z.string(),
    VINO_JP_CONFIG_DB_PASSWORD: z.string(),
    VINO_JP_CONFIG_DB_NAME: z.string(),
    VINO_JP_CONFIG_WHITELIST_DB_NAME: z.string(),
    VINO_JP_CONFIG_DC_WEBHOOK_URL: z.string().url(),
    VINO_JP_CONFIG_BSKY_AES_KEY: z.string(),
    VINO_JP_MINIO_PUBLIC_URL: z.string(),
    VINO_JP_MINIO_PORT: z.coerce.number().int().min(1).max(65535),
    VINO_JP_MINIO_ENDPOINT: z.string(),
    VINO_JP_MINIO_ACCESS_KEY: z.string(),
    VINO_JP_MINIO_SECRET_KEY: z.string(),
    VINO_JP_MINIO_BUCKET: z.string(),

    VINO_JP_TV_CDN_URL: z.string(),
    VINO_JP_TV_LISTINGS_URL: z.string(),
    VINO_JP_TV_LINEUPS_URL: z.string(),
    VINO_JP_TV_LINEUPS_SET_BASE_URL: z.string(),
    VINO_JP_TV_PROGRAM_DETAILS_BASE_URL: z.string(),
    VINO_JP_TV_SEASON_CAST_URL: z.string(),

    // yoinked from google's ai on having an array as an .env var :/
    VINO_JP_STAFF_PIDS: z.string().transform((str) => str.split(",").map((s) => s.trim())),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

import type { Request } from "express";
import { env } from "../../src/env.ts";

export function parseServiceToken(req: Request): {
    ok: boolean;
    pid: number | undefined;
    access_key: string | undefined;
    serial_number: string | undefined;
    version: string | undefined;
    country: string | undefined;
} {
    const rawHeader = req.headers["x-nintendo-service-token"];

    if (!rawHeader || typeof rawHeader !== "string") {
        return {
            ok: false,
            pid: undefined,
            serial_number: undefined,
            access_key: undefined,
            version: undefined,
            country: undefined,
        };
    }

    let decoded: string;

    try {
        const data = Buffer.from(rawHeader, "base64");
        const buf = Buffer.alloc(data.length);
        const secret = env.VINO_JP_TOKEN_SECRET;

        for (let i = 0; i < data.length; i++) {
            buf[i] = data[i]! ^ secret.charCodeAt(i % secret.length);
        }

        decoded = buf.toString("utf8");
    } catch (e) {
        return {
            ok: false,
            pid: undefined,
            serial_number: undefined,
            access_key: undefined,
            version: undefined,
            country: undefined,
        };
    }

    const headerParts = decoded.split(",").map(p => p.trim());

    if (headerParts.length < 6) {
        return {
            ok: false,
            pid: undefined,
            serial_number: undefined,
            access_key: undefined,
            version: undefined,
            country: undefined,
        };
    }

    const pid = Number(headerParts[0]);
    const access_key = headerParts[1];
    const serial_number = `${headerParts[2]}${headerParts[3]}`; // combine third and fourth for serial
    const country = headerParts[4];
    const version = headerParts[5];

    return {
        ok: true,
        pid: isNaN(pid) ? undefined : pid,
        access_key,
        serial_number,
        country,
        version,
    };
}

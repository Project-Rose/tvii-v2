import { parseServiceToken } from "../utils/serviceToken.ts";
import { type Request, type Response, type NextFunction } from "express";
import {db, db_whitelist} from "../utils/db.ts";
import { logger } from "../utils/logger.ts";
import { env } from "../env.ts";
import { join } from "path";

const environment = env.VINO_JP_CONFIG_ENV as "dev" | "stg" | "prod";
const latest_version = "v1.2.6";

const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    const serviceToken = parseServiceToken(req);

    if (
        !serviceToken ||
        !serviceToken.pid ||
        !serviceToken.serial_number ||
        !serviceToken.access_key ||
        !serviceToken.version
    ) {
        logger.warn("Invalid service token: %j", serviceToken);
        //Were gonna assume the user has an outdated Rose Patcher pre-token update
        //Redirect to screen to update Rosé Patcher
        return res
            .contentType("text/html")
            .sendFile(
                join(__dirname, "..", "..", "pages", "error", "invalidToken.html")
            );
    }

    if (!serviceToken.version || serviceToken.version != latest_version) {
        //The token was parsed correctly, but Rose Patcher has been updated
        //Redirect to screen to update Rosé Patcher
        logger.error(
            "User has outdated Rose Patcher: %j", serviceToken);
        return res
            .contentType("text/html")
            .sendFile(
                join(
                    __dirname,
                    "..",
                    "..",
                    "pages",
                    "error",
                    "outdatedPlugin.html"
                )
            );
    }

    const whitelistRow = await db_whitelist("access_allowlist")
        .where("pid", serviceToken.pid)
        .first();

    const whitelistEnv = (whitelistRow?.env ?? "prod") as
        | "dev"
        | "stg"
        | "prod";

    const allowedEnvs: Record<"dev" | "stg" | "prod", string[]> = {
        dev: ["dev", "stg", "prod"],
        stg: ["stg", "prod"],
        prod: ["prod"],
    };

    if (!whitelistEnv || !allowedEnvs[whitelistEnv].includes(environment)) {
        logger.warn(
            "User %s tried to access %s without whitelist permission",
            serviceToken.pid,
            environment
        );
        return res
            .contentType("text/html")
            .sendFile(
                join(
                    __dirname,
                    "..",
                    "..",
                    "pages",
                    "error",
                    "unauthorized_en.html"
                )
            );
    }

    return next();
};

export { middleware as access };

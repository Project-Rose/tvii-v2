import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
//@ts-ignore
import Mii from "@pretendonetwork/mii-js";
import { parseServiceToken } from "../../utils/serviceToken.ts";
import { db } from "../../utils/db.ts";
import { z } from "zod";
import { BskyClient } from "../../utils/bsky.ts";
import { env } from "../../env.ts";
import crypto from "crypto";
import { logger } from "../../utils/logger.ts";

// Key must be 32 bytes for AES-256
const AES_KEY = Buffer.from(env.VINO_JP_CONFIG_BSKY_AES_KEY, "base64");

function encrypt(text: string): any {
    const iv = crypto.randomBytes(16); // new IV every time
    const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    // Store IV along with ciphertext
    return iv.toString("base64") + ":" + encrypted;
}

function decrypt(data: string): any {
    const [ivBase64, encryptedData] = data.split(":");
    const iv = Buffer.from(ivBase64!, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, iv);
    let decrypted = decipher.update(encryptedData!, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const router: Router = express.Router();

const upload = multer();

router.get("/status", async (req: Request, res: Response): Promise<any> => {
    res.status(200).send("ok");
});

router.post(
    "/createAccount",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);
            //Creates a new Nintendo TVii account instance for that console
            const data = req.body;

            const serialNumber = token.serial_number;
            const accessKey = token.access_key;
            //Country code
            const countryCode = token.country;
            const principalId = token.pid;

            const existing = await db("account")
                .where({ pid: principalId })
                .first();

            if (existing) {
                console.warn(
                    `Account already exists for: ${token.pid} set up from Serial Number ${token.serial_number}`
                );
                return res.status(500).json({
                    status: "error",
                });
            }

            const checkPID = await fetch(
                `https://mii-unsecure.ariankordi.net/mii_data/?pid=${principalId}&api_id=1&force_refresh=1`
            );
            if (!checkPID.ok) {
                console.warn(
                    `Mii Unsecure Pretendo fetching error for : ${token.pid} ${token.serial_number}`
                );
                return res.status(500).json({
                    status: "error_not_pretendo",
                });
            }

            const checkPIDData = await checkPID.json() as any;

            const mii_name = checkPIDData!.name!;
            const mii_data = checkPIDData!.data!;

            const mii = new Mii(Buffer.from(mii_data, "base64"));

            //US way of doing dates !
            const mii_bday = mii.birthMonth + "/" + mii.birthDay;

            // Country comes from the NN linked account now, no longer the local country
            if (
                countryCode && countryCode.length != 2
            ) {
                return res.status(500).json({
                    status: "error",
                    error: "Invalid country.",
                });
            }

            //Used for creating the session, will be stored in DB to refresh token.
            let hashedBskyPass = null;
            let hashedBskySess = null;
            let bskyUsername = data.bskyUsernameTemp
                ? data.bskyUsernameTemp
                : null;
            let bskySession = null;
            //If user did log in to Bluesky
            if (
                data.bskyUsernameTemp &&
                data.bskyPasswordTemp &&
                data.bskyUsernameTemp.length &&
                data.bskyPasswordTemp.length
            ) {
                let bsky = new BskyClient();

                bskySession = await bsky.login(
                    data.bskyUsernameTemp,
                    data.bskyPasswordTemp
                );

                if (!bskySession) {
                    console.warn(
                        `Error fetching bsky login for: ${token.pid} ${token.serial_number} ${bskySession}`
                    );
                }

                hashedBskyPass = encrypt(data.bskyPasswordTemp);
                hashedBskySess = encrypt(JSON.stringify(bskySession));
            }

            const tvProviderIdChosen = data.tv_provider_id;
            const tvProviderTzChosen = data.tv_provider_tz;

            // Extract the user's IP
            let ip =
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.ip;

            // If x-forwarded-for contains multiple IPs, take the first
            if (typeof ip === "string" && ip.includes(",")) {
                ip = ip.split(",")[0];
            }

            // Strip IPv6 prefix
            if (typeof ip === "string" && ip.startsWith("::ffff:")) {
                ip = ip.substring(7);
            }

            const ipReq = await fetch(`https://ipwho.is/${ip}`);
            const ipInfo = await ipReq.json() as any;
            let utc_offset;

            if (
                ipInfo &&
                ipInfo.success &&
                ipInfo.timezone &&
                typeof ipInfo.timezone.offset === "number"
            ) {
                utc_offset = ipInfo.timezone.offset;
            } else {
                console.warn(
                    `UTC offset fetching error : ${token.pid} ${token.serial_number}`
                );
                return res.status(500).json({
                    status: "error",
                });
            }

            const userEnv = env.VINO_JP_CONFIG_ENV;

            const createdAccount = await db("account").insert({
                pid: principalId,
                country: countryCode,
                mii_data,
                mii_name,
                mii_bday,
                utc_offset,
                serial_number: serialNumber,
                access_key: accessKey,
                last_data_update: new Date().toISOString(),
                env: userEnv,
            });

            if (!createdAccount) {
                console.warn(
                    `Failed to insert account to DB : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Account creation failed, could not insert to the DB",
                });
                return;
            }

            console.log("Insert successful. New user:", token.pid);

            const createdSettings = await db("settings").insert({
                pid: token.pid,
                tv_provider_id: tvProviderIdChosen,
                tv_provider_tz: tvProviderTzChosen,
                bsky_auth_session_json: hashedBskySess,
                bsky_password_hashed: hashedBskyPass,
                bsky_username: bskyUsername,
            });

            if (
                !Array.isArray(createdSettings) ||
                createdSettings.length === 0
            ) {
                console.warn(
                    `Failed to submit settings information on database : ${token.pid} ${token.serial_number}`
                );
                res.status(500).json({
                    status: "error",
                    error: "Account creation failed, account created but settings could not be inserted.",
                });
                return;
            }

            let raw = data.favorite_channels;
            let favorites;

            try {
                favorites = JSON.parse(raw);
            } catch (e) {
                return res.status(400).json({ status: "error", error: "Invalid favorite_channels JSON" });
            }

            if (Array.isArray(favorites) && favorites.length !== 0) {
                var now = new Date().toISOString();

                var rows = [];
                for (var i = 0; i < favorites.length; i++) {
                    rows.push({
                        create_time: now,
                        pid: token.pid,
                        channel_id: favorites[i]
                    });
                }

                try {
                    await db("favorite_channels").insert(rows);
                } catch (err) {
                    console.error(err);
                    return res.status(500).json({
                        status: "error",
                        error: "DB insert failed"
                    });
                }
            }

            res.status(200).json({
                status: "verified",
                pid: token.pid,
            });
        } catch (error) {
            console.error("/createAccount error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error",
            });
        }
    }
);

router.post(
    "/checkLogIn",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            // Fetch account + settings in one query
            const account = await db("account")
                .leftJoin("settings", "settings.pid", "account.pid")
                .select(
                    "account.*",
                    "settings.pid as setting_pid",
                    "settings.tv_provider_id"
                )
                .where({
                    "account.pid": token.pid,
                    "account.serial_number": token.serial_number,
                    "account.access_key": token.access_key,
                })
                .first();

            const country = token.country;

            if (!account) {
                return res.status(200).json({
                    status: "no_account_yet",
                    profile: { country_code: country },
                });
            }

            let utc_offset = account.utc_offset;

            // Collect only changed values for update
            const updateValues: any = {};
            if (account.country !== country) updateValues.country = country;

            const now = new Date();
            const lastUpdate = account.last_data_update
                ? new Date(account.last_data_update)
                : new Date(0);

            const oneHour = 60 * 60 * 1000;
            if (now.getTime() - lastUpdate.getTime() > oneHour) {
                try {
                    const updateMiiData = await fetch(
                        `https://mii-unsecure.ariankordi.net/mii_data/?pid=${token.pid}&api_id=1&force_refresh=1`
                    );

                    if (updateMiiData.ok) {
                        const PIDData = await updateMiiData.json() as any;
                        const mii_name = PIDData.name;
                        const mii_data = PIDData.data;

                        const mii = new Mii(Buffer.from(mii_data, "base64"));
                        const mii_bday = mii.birthDay + "/" + mii.birthMonth;

                        // Extract IP
                        let ip =
                            req.headers["x-forwarded-for"] ||
                            req.connection.remoteAddress ||
                            req.ip;

                        if (typeof ip === "string" && ip.includes(",")) {
                            ip = ip.split(",")[0];
                        }
                        if (typeof ip === "string" && ip.startsWith("::ffff:")) {
                            ip = ip.substring(7);
                        }

                        const ipReq = await fetch(`https://ipwho.is/${ip}`);
                        const ipInfo = await ipReq.json() as any;

                        if (
                            ipInfo &&
                            ipInfo.success &&
                            ipInfo.timezone &&
                            typeof ipInfo.timezone.offset === "number"
                        ) {
                            utc_offset = ipInfo.timezone.offset;
                        }

                        // Batch all updates together
                        Object.assign(updateValues, {
                            mii_name,
                            mii_data,
                            mii_bday,
                            utc_offset,
                            last_data_update: new Date().toISOString(),
                        });

                        console.log(
                            `PNID Data and UTC offset updated for PID: ${token.pid}`
                        );
                    } else {
                        // Just bump timestamp if fetch failed
                        updateValues.last_data_update = new Date().toISOString();
                    }
                } catch (err) {
                    console.warn("Mii/IP update failed:", err);
                    updateValues.last_data_update = new Date().toISOString();
                }
            }

            // Apply updates if needed
            if (Object.keys(updateValues).length > 0) {
                await db("account")
                    .where({
                        pid: token.pid,
                        serial_number: token.serial_number,
                        access_key: token.access_key,
                    })
                    .update(updateValues);
            }

            if (!account.pid) {
                return res.status(400).json({
                    status: "error",
                    error: "Could not get user settings.",
                });
            }

            res.status(200).json({
                status: "verified",
                profile: {
                    utc_offset,
                    user_id: account.pid,
                    tv_provider_id: account.tv_provider_id,
                    country_code: country,
                },
            });
        } catch (error) {
            console.error("/checkLogIn error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error.",
            });
        }
    }
);


router.get("/reminders", async (req: Request, res: Response): Promise<any> => {
    console.log("hi aroma plugin", req);
    try {
        res.status(200).json({
            status: "success",
            reminders: [
                {
                    name: "Family Guy",
                    time: 1754011800,
                    utc_offset: -18000,
                },
            ],
        });
    } catch (error) {
        console.error("/reminders error:", error);
        res.status(500).json({
            status: "error",
            error: "Internal server error.",
        });
    }
});

export { router as account };

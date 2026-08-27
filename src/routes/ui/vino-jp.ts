import express, { type Request, type Response, type Router } from "express";
import { join } from "path";
import { parseServiceToken } from "../../utils/serviceToken.ts";
import { db } from "../..//utils/db.ts";
import { getRegion } from "../..//utils/other.ts";
import Mii from "@pretendonetwork/mii-js";

const router: Router = express.Router();

// Serves the frontend HTML
router.get("/", async (req: Request, res: Response): Promise<any> => {
    const token = parseServiceToken(req);

    if (!token.ok) {
        return res.send(404).end();
    }

    res.redirect("/index.html");
});

// Serves the frontend HTML
router.get("/setup.html", async (req: Request, res: Response): Promise<any> => {
    const lang = (req.headers["accept-language"] || "en").split(",")[0]!.split("-")[0]!.toLowerCase();
    const token = parseServiceToken(req);

    if (!token.ok) {
        return res.send(404).end();
    }

    const account = await db("account")
        .where({
            pid: token.pid,
            serial_number: token.serial_number,
            access_key: token.access_key,
        })
        .first();

    // If account, redirect to default
    if (account) {
        return res.redirect("/index.html");
    }

    res.render("setup.ejs", {
        pid: token.pid,
        country: token.country,
        lang: lang,
        region: getRegion(token.country!)
    });
});

router.get("/index.html", async (req: Request, res: Response): Promise<any> => {
    const lang = (req.headers["accept-language"] || "en")
        .split(",")[0]!.split("-")[0]!.toLowerCase();

    const token = parseServiceToken(req);

    if (!token.ok) {
        return res.sendStatus(404);
    }

    // Fetch account + settings
    const account = await db("account")
        .leftJoin("settings", "settings.pid", "account.pid")
        .select(
            "account.*",
            "settings.pid as setting_pid",
            "settings.tv_provider_id",
            "settings.tv_provider_tz"
        )
        .where({
            "account.pid": token.pid,
            "account.serial_number": token.serial_number,
            "account.access_key": token.access_key,
        })
        .first();

    if (!account) {
        return res.redirect("/setup.html");
    }

    const country = token.country;
    let utc_offset = account.utc_offset;

    const updateValues: any = {};

    // update country if changed
    if (account.country !== country) {
        updateValues.country = country;
    }

    // check 1 hour rule
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

                // Extract real IP (Cloudflare first)
                let ip =
                    req.headers["cf-connecting-ip"] ||
                    req.headers["x-forwarded-for"] ||
                    req.connection.remoteAddress ||
                    req.ip;

                if (typeof ip === "string" && ip.includes(",")) {
                    ip = ip.split(",")[0];
                }

                if (typeof ip === "string" && ip.startsWith("::ffff:")) {
                    ip = ip.substring(7);
                }

                // timezone lookup
                const ipReq = await fetch(`https://ipwho.is/${ip}`);
                const ipInfo = await ipReq.json() as any;

                if (
                    ipInfo?.success &&
                    ipInfo?.timezone &&
                    typeof ipInfo.timezone.offset === "number"
                ) {
                    utc_offset = ipInfo.timezone.offset;
                }

                Object.assign(updateValues, {
                    mii_name,
                    mii_data,
                    mii_bday,
                    utc_offset,
                    last_data_update: new Date(),
                });

                console.log(`PNID Data + UTC updated for PID ${token.pid}`);
            } else {
                updateValues.last_data_update = new Date();
            }
        } catch (err) {
            console.warn("Mii/IP update failed:", err);
            updateValues.last_data_update = new Date();
        }
    }

    // apply DB updates
    if (Object.keys(updateValues).length > 0) {
        await db("account")
            .where({
                pid: token.pid,
                serial_number: token.serial_number,
                access_key: token.access_key,
            })
            .update(updateValues);

        Object.assign(account, updateValues);
    }

    // render (always correct values)
    res.render("index.ejs", {
        pid: token.pid,
        country: account.country,
        region: getRegion(account.country),
        tz_name: account.tv_provider_tz,
        tv_provider_id: account.tv_provider_id,
        utc_offset: account.utc_offset,
        lang: lang,
    });
});



export { router as vinoRoute };

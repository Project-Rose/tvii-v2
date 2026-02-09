import express, { type Request, type Response, type Router } from "express";
import { join } from "path";
import { parseServiceToken } from "../../utils/serviceToken.ts";
import { db } from "../..//utils/db.ts";
import { getRegion } from "../..//utils/other.ts";

const router: Router = express.Router();

// Serves the frontend HTML
router.get("/", async (req: Request, res: Response): Promise<any> => {
    const token = parseServiceToken(req);

    const account = await db("account")
        .where({
            pid: token.pid,
            serial_number: token.serial_number,
            access_key: token.access_key,
        })
        .first();

    // If no account found, redirect to setup.html
    if (!account) {
        return res.redirect("/setup.html");
    }

    res.redirect("/index.html");
});

// Serves the frontend HTML
router.get("/setup.html", async (req: Request, res: Response): Promise<any> => {
    const token = parseServiceToken(req);

    if (!token.ok) {
        res.send(404).end();
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
        region: getRegion(token.country!)
    });
});

// Serves the frontend HTML
router.get("/index.html", async (req: Request, res: Response): Promise<any> => {
    const token = parseServiceToken(req);

    if (!token.ok) {
        res.send(404).end();
    }

    const account = await db("account")
        .leftJoin("settings", "settings.pid", "account.pid")
        .select(
            "account.*",
            "settings.tv_provider_id",
            "settings.tv_provider_tz"
        )
        .where({
            "account.pid": token.pid,
            "account.serial_number": token.serial_number,
            "account.access_key": token.access_key,
        })
        .first();

    // If no account found, redirect to setup.html
    if (!account) {
        return res.redirect("/setup.html");
    }

    res.render("index.ejs", {
        pid: token.pid,
        country: token.country,
        region: getRegion(token.country!),
        tz_name: account.tv_provider_tz,
        tv_provider_id: account.tv_provider_id,
        utc_offset: account.utc_offset
    });
});


export { router as vinoRoute };

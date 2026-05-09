import express, { type Request, type Response, type Router } from "express";
import { createCanvas, loadImage, registerFont } from "canvas";
import NodeCache from "node-cache";
import { db } from "../../utils/db.ts";
import path from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";
import { env } from "../../env.ts";
import { getMiiImageUrl } from "../../utils/other.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// optional custom font
registerFont(
    path.join(__dirname, "../../../static/font/nintendo_NTLGDB_001.ttf"),
    { family: "nintendo" }
);

const redis = new Redis();

const backgrounds = [
    path.join(__dirname, "../../../static/title/blue.png"),
    path.join(__dirname, "../../../static/title/pink.png"),
    path.join(__dirname, "../../../static/title/orange.png")
];

const sign_path = path.join(__dirname, "../../../static/title/name-signage.png")
const mii_bg_path = path.join(__dirname, "../../../static/title/mii-bg.png")

const router: Router = express.Router();

const cache = new NodeCache({
    stdTTL: 2 * 60 * 60, // 2 hours (7200 seconds)
    checkperiod: 60 * 60 // cleanup every hour
});

const label_text = {
    en: "User of the day",
    es: "Usuario del día",
    fr: "Utilisateur du jour"
};

const post_count_label = {
    en: " posts",
    es: " mensajes",
    fr: " messages"
};

function getSecondsUntilMidnight() {
    const now = new Date();

    const nyNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    const nyMidnight = new Date(nyNow);
    nyMidnight.setHours(24, 0, 0, 0);

    return Math.floor((nyMidnight.getTime() - nyNow.getTime()) / 1000);
}

router.get("/", async (req: Request, res: Response) => {
    try {
        const lang = String(req.query.lang || "en").toLowerCase();
        const label_text_top = label_text[lang as keyof typeof label_text] || label_text.en;
        const label_post_count = post_count_label[lang as keyof typeof post_count_label] || post_count_label.en;

        const ttl = getSecondsUntilMidnight();

        const userKey = "title:" + env.VINO_JP_CONFIG_ENV + ":t_user_of_day";// shared
        const imageKey = `user_of_day_img_${lang}`; // per language

        const cachedImage = cache.get<Buffer>(imageKey);
        if (cachedImage) {
            res.set("Content-Type", "image/png");
            return res.send(cachedImage);
        }

        let randomUserCache = await redis.get(userKey);

        let randomUser = null;

        if (randomUserCache) {
            try {
                randomUser = JSON.parse(randomUserCache);
            } catch {
                // corrupted cache
                await redis.del(userKey);
            }
        }


        if (!randomUser) {
            const latestUsers = await db("account as a")
                .leftJoin("posts as p", "p.pid", "a.pid")
                .whereNotIn("a.pid", env.VINO_JP_STAFF_PIDS)
                .select("a.*")
                .count("p.post_id as post_count")
                .groupBy("a.pid")
                .orderBy("post_count", "desc")
                .orderBy("a.last_data_update", "desc")
                .limit(20);

            if (!latestUsers.length) {
                return res.status(404).send("No users");
            }

            randomUser =
                latestUsers[Math.floor(Math.random() * latestUsers.length)];

            // cache user until midnight
            await redis.set(
                userKey,
                JSON.stringify(randomUser),
                "EX",
                ttl
            );
        }

        const width = 854;
        const height = 885;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        const randomBgPath =
            backgrounds[Math.floor(Math.random() * backgrounds.length)];

        const miiImageUrl = getMiiImageUrl(
            randomUser.mii_data,
            `type=face&width=226&texResolution=168`);
        const [bg, miiImage, mii_bg, name_bg] = await Promise.all([
            loadImage(randomBgPath!),
            loadImage(miiImageUrl).catch((err: unknown) => {
                console.warn("Mii image unavailable while obtaining card", err);
                return null;
            }),
            loadImage(mii_bg_path),
            loadImage(sign_path)
        ]);

        // draw
        const mii_x = 310;
        const mii_y = 80;

        ctx.drawImage(bg, 0, 0);
        ctx.drawImage(mii_bg, mii_x, mii_y);
        if (miiImage) {
            ctx.drawImage(miiImage, mii_x + 4, mii_y + 4);
        }
        ctx.drawImage(name_bg, 184, 310);

        // title
        ctx.font = "40px nintendo";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillText(label_text_top, width / 2, 42);

        // name
        ctx.shadowColor = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#323232";
        ctx.fillText(String(randomUser.mii_name), width / 2, 366);

        // post count
        ctx.fillStyle = "#FFF";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.font = "30px nintendo";
        ctx.fillText(randomUser.post_count + label_post_count, width / 2, 436);

        const buffer = canvas.toBuffer("image/png");
        cache.set(imageKey, buffer, ttl);

        res.set("Content-Type", "image/png");
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

export { router as title };

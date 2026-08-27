import express, { type Request, type Response, type Router } from "express";

import NodeCache from "node-cache";
import { env } from "../../env.ts";

const router: Router = express.Router();

const cache = new NodeCache({
    stdTTL: 168 * 60 * 60, // 48 hours
    checkperiod: 60 * 60 // cleanup every hour
});

router.get("/", async (req: Request, res: Response) => {
    try {
        // keep req.query exactly as requested
        const query = new URLSearchParams(
            req.query as Record<string, string>
        ).toString();

        const cached = cache.get<Buffer>(query);
        if (cached) {
            res.contentType("image/png");
            return res.send(cached);
        }

        const url =
            `${env.VINO_JP_MII_IMAGE_PNG_BASE_URL}?verifyCRC16=1&${query}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).send("Image fetch failed");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        cache.set(query, buffer);
        res.contentType("image/png");
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch image");
    }
});

export { router as miis };

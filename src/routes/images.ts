import express, { type Request, type Response, type Router } from "express";
import sharp from "sharp";
import NodeCache from "node-cache";
import { env } from "../env";

const router: Router = express.Router();
const imageCache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 7, // 7 days
    checkperiod: 60 * 60, // check expired items every hour
});

router.get("/cdn/:imageId", async (req: Request, res: Response): Promise<any> => {
    try {
        const { imageId } = req.params;
        const width = req.query["width"]
            ? parseInt(req.query["width"] as string, 10)
            : undefined;
        const height = req.query["height"]
            ? parseInt(req.query["height"] as string, 10)
            : undefined;

        const cacheKey = `${imageId}-${width || "auto"}x${height || "auto"}`;
        const cachedImage = imageCache.get<Buffer>(cacheKey);

        if (cachedImage) {
            res.set("Content-Type", "image/png");
            return res.status(200).send(cachedImage);
        }

        const imageUrl = `https://cdn.projectrose.cafe/tvii-jp-d1/${imageId}`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return res.status(404).json({ error: "Image not found" });
        }

        // Always convert ArrayBuffer -> Buffer safely
        const arrayBuffer = await response.arrayBuffer();
        let buffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));

        // Resize if requested
        if (width || height) {
            buffer = await sharp(buffer)
                .resize(width, height, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toBuffer();
        }

        // Cache it
        imageCache.set(cacheKey, buffer);

        res.set("Content-Type", "image/png");
        return res.status(200).send(buffer);
    } catch (err) {
        console.error("Image proxy error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get(/^\/cdn\/tvp\/(.+)$/, async (req: Request, res: Response) => {
    try {
        const imagePath = req.params[0];

        const width = req.query.width
            ? parseInt(req.query.width as string, 10)
            : undefined;

        const height = req.query.height
            ? parseInt(req.query.height as string, 10)
            : undefined;

        const cacheKey = `tvp-${imagePath}-${width || "auto"}x${height || "auto"}`;
        const cachedImage = imageCache.get<Buffer>(cacheKey);

        if (cachedImage) {
            res.set("Content-Type", "image/png");
            return res.status(200).send(cachedImage);
        }

        const imageUrl = `https://${env.VINO_JP_TV_CDN_URL}/${imagePath}`;

        const response = await fetch(imageUrl, {
            tls: {
                rejectUnauthorized: false,
            },
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/png,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.tvpassport.com/",
                "Sec-Fetch-Dest": "image",
                "Sec-Fetch-Mode": "no-cors",
                "Sec-Fetch-Site": "cross-site",
            },
        });

        if (!response.ok) {
            return res.status(404).json({ error: "Image not found" });
        }

        const arrayBuffer = await response.arrayBuffer();

        let buffer: Buffer = Buffer.from(arrayBuffer);

        // Resize if requested
        if (width || height) {
            buffer = await sharp(buffer)
                .resize(width, height, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .png()
                .toBuffer();
        }

        imageCache.set(cacheKey, buffer);

        res.set("Content-Type", "image/png");
        return res.status(200).send(buffer);
    } catch (err) {
        console.error("TVPassport image proxy error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export { router as images };

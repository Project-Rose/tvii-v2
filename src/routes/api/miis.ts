import express, { type Request, type Response, type Router } from "express";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const query = new URLSearchParams(
        req.query as Record<string, string>
    ).toString();
    const url = `https://mii-unsecure.ariankordi.net/miis/image.png?verifyCRC16=0&${query}`;

    const response = await fetch(url);

    res.status(response.status);

    const buffer = await response.arrayBuffer();
    res.contentType("image/png");
    res.send(Buffer.from(buffer));
});

export { router as miis };

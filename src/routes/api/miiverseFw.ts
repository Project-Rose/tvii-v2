import express, { type Request, type Response } from "express";
const router = express.Router();
import multer from "multer";
const upload = multer();

/*router.get("/posts", async (req: Request, res: Response): Promise<any> => {
    const apiUrl = req.header("X-Nintendo-Olv-Api-Url");
    const serviceToken = req.header("X-Nintendo-ServiceToken");
    const paramPack = req.header("X-Nintendo-ParamPack");
    const userAgent = req.header("X-Nintendo-Olv-User-Agent");

    if (!apiUrl || !serviceToken || !paramPack || !userAgent) {
        return res.status(400).json({ error: "Missing required headers." });
    }

    // Build query parameters
    const searchParams = new URLSearchParams();

    // Default required params
    searchParams.set("language_id", "254");
    searchParams.set("limit", String(req.query["limit"] || "10"));
    searchParams.set("distinct_pid", "1");
    searchParams.set("with_mii", "1");
    searchParams.set("allow_spoiler", "1");
    searchParams.set("with_empathy_added", "1");

    // Append all search_key (can be array or string)
    const searchKeys = req.query["search_key"];
    if (Array.isArray(searchKeys)) {
        for (const key of searchKeys) {
            searchParams.append("search_key", String(key));
        }
    } else if (typeof searchKeys === "string") {
        searchParams.append("search_key", searchKeys);
    }

    // Construct final endpoint
    const endpoint = `${apiUrl}/v1/communities/0/posts?${searchParams.toString()}`;
    console.log("Requesting:", endpoint);

    try {
        const headers = new Headers({
            "X-Nintendo-ServiceToken": serviceToken,
            "X-Nintendo-ParamPack": paramPack,
            "User-Agent": userAgent
        });

        const response = await fetch(endpoint, {
            method: "GET",
            headers
        });

        res.status(response.status);
        res.setHeader("Content-Type", "application/xml");
        const body = await response.text();
        res.send(body);
    } catch (error) {
        console.error("Miiverse fetch error:", error);
        res.status(500).json({ error: "Failed to fetch posts", detail: (error as Error).message });
    }
});

router.post("/posts", async (req: Request, res: Response): Promise<any> => {
    const apiUrl = req.header("X-Nintendo-Olv-Api-Url");
    const serviceToken = req.header("X-Nintendo-ServiceToken");
    const paramPack = req.header("X-Nintendo-ParamPack");
    const userAgent = req.header("X-Nintendo-Olv-User-Agent");

    if (!apiUrl || !serviceToken || !paramPack || !userAgent) {
        return res.status(400).json({ error: "Missing required headers/form data." });
    }

    // Construct final endpoint
    const endpoint = `${apiUrl}/v1/posts`;
    console.log("Requesting:", endpoint);

    try {
        // Forward *all* original headers required for multipart/form-data
        const forwardHeaders: Record<string, string> = {
            "X-Nintendo-ServiceToken": serviceToken,
            "X-Nintendo-ParamPack": paramPack,
            "User-Agent": userAgent,
            "Content-Type": req.headers["content-type"] as string // keep boundary
        };

        // Pipe the raw request body directly to fetch
        const response = await fetch(endpoint, {
            method: "POST",
            headers: forwardHeaders,
            body: req as any // streaming raw request body
        });

        // Forward status and XML body as-is
        res.status(response.status);
        res.setHeader("Content-Type", "application/xml");
        res.send(await response.text());
    } catch (error) {
        console.error("Miiverse post fetch error:", error);
        res.status(500).json({
            error: "Failed to fetch posts",
            detail: (error as Error).message
        });
    }
});*/
export { router as miiverse };

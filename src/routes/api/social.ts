import express, { type Request, type Response, type Router } from "express";
import multer from "multer";
import { env } from "../../env.ts";
import { getMiiImageUrl, expressionFromFeeling } from "../../utils/other.ts";
import NnasClient from "../../utils/nnasClient.ts";
import crypto from "crypto";
import { BskyClient } from "../../utils/bsky.ts";
import { parseServiceToken } from "../../utils/serviceToken.ts";
import { db } from "../../utils/db.ts";
import { TwitterApi } from "twitter-api-v2";

// Key must be 32 bytes for AES-256
const AES_KEY = Buffer.from(env.VINO_JP_CONFIG_BSKY_AES_KEY, "base64");

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // new IV every time
    const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    // Store IV along with ciphertext
    return iv.toString("base64") + ":" + encrypted;
}

function decrypt(data: string): string {
    const [ivBase64, encryptedData] = data.split(":");
    const iv = Buffer.from(ivBase64!, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, iv);
    let decrypted = decipher.update(encryptedData!, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

function buildSocialPost(
    maxLength: number,
    topicTag: string | null,
    body: string | null,
    type: number
): string {
    const MIN_TAG_LEN = 40;
    const MAX_BODY_LEN = 200;
    const MAX_TWEET_LEN = maxLength;

    topicTag = topicTag || "a TV program";
    body = body || "";

    const prefix = type === 1
        ? 'Posted while watching "'
        : type === 2
            ? 'Made a memo while watching "'
            : type === 3
                ? 'Made a doodle while watching "'
                : '';
    const suffix = " #NintendoTVii"; // always the same now

    let tweetText: string;

    if (type === 1 || type === 3) {
        // Cap body length first
        if (body.length > MAX_BODY_LEN) {
            body = body.slice(0, MAX_BODY_LEN - 1) + "…";
        }

        // Compute available length for topicTag considering prefix + body + 2 quotes + suffix
        const fixedLen = prefix.length + body.length + 2 + suffix.length; // 2 quotes for topic and body
        let availableTagLen = MAX_TWEET_LEN - fixedLen;

        if (availableTagLen < MIN_TAG_LEN) {
            availableTagLen = MIN_TAG_LEN; // force minimum
        }

        if (topicTag.length > availableTagLen) {
            topicTag = topicTag.slice(0, availableTagLen - 1) + "…";
        }

        tweetText = `${prefix}${topicTag}": "${body}"${suffix}`;
    } else {
        // No body — topic can take almost everything
        const fixedLen = prefix.length + 2 + suffix.length; // 2 quotes
        let availableTagLen = MAX_TWEET_LEN - fixedLen;

        if (topicTag.length > availableTagLen) {
            topicTag = topicTag.slice(0, availableTagLen - 1) + "…";
        }

        tweetText = `${prefix}${topicTag}"${suffix}`;
    }

    return tweetText;
}

const router: Router = express.Router();

const upload = multer();

import {
    S3Client,
    ObjectCannedACL,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import Redis from "ioredis";
import * as cheerio from "cheerio";

const redis = new Redis();

// Create S3 client for MinIO
const s3 = new S3Client({
    endpoint: "https://" + env.VINO_JP_MINIO_PUBLIC_URL, // change to your MinIO URL
    region: "us-east-1", // MinIO ignores, but AWS SDK requires it
    credentials: {
        accessKeyId: env.VINO_JP_MINIO_ACCESS_KEY, // replace with your MinIO Access Key
        secretAccessKey: env.VINO_JP_MINIO_SECRET_KEY, // replace with your MinIO Secret Key
    },
    forcePathStyle: true, // REQUIRED for MinIO
});

router.post(
    "/BSLoginCheck",
    upload.none(),
    async (_req: Request, res: Response): Promise<any> => {
        try {
            //Just checks if the account exists
            //Session is created and put on DB once the account actually gets created and inserted.
            const data = _req.body;
            const identifier = data.username;
            const passwd = data.password;

            if (!identifier || !passwd) {
                res.status(400).send({
                    error: "Identifier and password are required.",
                });
                return;
            }

            const bsky = new BskyClient();

            const check = await bsky.login(identifier, passwd);

            if (!check) {
                res.status(400).json({ error: "Invalid account." });
            }

            const info = await bsky.agent.getProfile({ actor: check.did });

            res.status(200).json({
                status: "verified",
                active: check.active,
                handle: check.handle,
                displayName: info.data.displayName,
            });
        } catch (error) {
            console.error("/BSLoginCheck error:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.get(
    "/getUserData/:pid",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const pid = req.params.pid as string;
            if (!pid) return res.status(400).json({ error: "Missing pid" });

            const account = await db("account")
                .where({ pid })
                .first();

            if (!account) {
                return res.status(404).json({ error: "Account not found" });
            }

            const postCountRow = await db("posts")
                .where({ pid })
                .count("* as count")
                .first();

            const post_count = Number(postCountRow?.count || 0);

            // ============================
            // 3️⃣ GET MII USER ID (cache)
            // ============================
            const miiCacheKey = `user:${pid}:cached_data`;
            let user_id: string | null = null;
            let latest_post_id: string | null = null;

            const cachedUserData = await redis.get(miiCacheKey);

            if (cachedUserData) {
                user_id = JSON.parse(cachedUserData).user_id;
                latest_post_id = JSON.parse(cachedUserData).latest_post_id;
            } else {
                try {
                    user_id = (await NnasClient.miiFromPid(pid)).userId;

                } catch (err) {
                    console.error("Mii fetch error:", err);
                }

                try {
                    const juxtResp = await fetch(
                        `https://juxt.pretendo.network/users/${pid}`
                    );

                    if (juxtResp.ok) {
                        const html = await juxtResp.text();
                        const $ = cheerio.load(html);

                        // first post wrapper
                        const postWrapper = $(".posts-wrapper").first();

                        if (postWrapper.length) {
                            latest_post_id = postWrapper.attr("id") || null;
                        }
                    }

                    await redis.set(
                        miiCacheKey,
                        JSON.stringify({ user_id, latest_post_id }),
                        "EX",
                        60 * 60 // 1 hour
                    );
                } catch (err) {
                    console.error("Juxt scrape error:", err);
                }
            }

            // TypeScript needed the "as string" for some reason
            if (env.VINO_JP_STAFF_PIDS.includes(pid as string)) {
                user_id = "??????????"
            }

            return res.json({
                mii_name: account.mii_name,
                mii_data: account.mii_data,
                user_id,
                latest_post_id,
                post_count
            });

        } catch (error) {
            console.error("/getUserData error:", error);
            return res.status(500).json({ error: "Internal server error." });
        }
    }
);

router.post(
    "/postsAlt",
    upload.none(),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(200).json({ status: "no_account_yet" });
            }

            const userSettings = await db("settings")
                .where({ pid: account.pid })
                .first();

            let bskyAgent = null;
            let resumedSession = null;

            //Check for bsky errors (because bsky is good)
            //Only if user did link bsky to their account
            if (userSettings.bsky_auth_session_json != null) {
                const session = JSON.parse(
                    decrypt(userSettings.bsky_auth_session_json)
                );
                bskyAgent = new BskyClient();

                try {
                    // First try resuming the saved session
                    resumedSession =
                        await bskyAgent.agent.resumeSession(session);
                } catch (resumeErr) {
                    console.log(
                        "could not resume bsky session (will try to create new session):",
                        resumeErr
                    );

                    try {
                        // Fallback: decrypt stored credentials
                        const username = userSettings.bsky_username;
                        const password = decrypt(
                            userSettings.bsky_password_hashed
                        );

                        // Login fresh
                        resumedSession = await bskyAgent.login(
                            username,
                            password
                        );

                        // Save the new session back to DB (encrypted)
                        await db("settings")
                            .where({ pid: account.pid })
                            .update({
                                bsky_auth_session_json: encrypt(
                                    JSON.stringify(resumedSession)
                                ),
                            });
                    } catch (loginErr) {
                        console.log(
                            "could not login with bsky stored credentials (changed pass/no app password):",
                            loginErr
                        );

                        // If both fail, return JSON response immediately
                        return res.status(401).json({
                            status: "bsky_credentials_expired",
                            error: "Bluesky auth failed. Please log in again from Menu>Settings.",
                        });
                    }
                }
            }
            //If no bsky linked skip

            if (!userSettings) {
                return res.status(400).json({
                    status: "error",
                    error: "Could not get user settings.",
                });
            }

            const postForm = req.body;
            const searchKeys = [].concat(postForm.search_key || []);

            const feelingId = parseInt(postForm.feeling_id, 10);
            const safeFeelingId = isNaN(feelingId) ? 0 : feelingId;

            const isSpoiler = parseInt(postForm.is_spoiler, 10);
            const safeIsSpoiler = isNaN(isSpoiler) ? 0 : isSpoiler;

            const hasBody = postForm.body && postForm.body.trim().length > 0;
            const hasPainting =
                postForm.painting && postForm.painting.trim().length > 0;

            const hasScreenshot =
                postForm.screenshot && postForm.screenshot.trim().length > 0;

            if (!hasBody && !hasPainting) {
                return res.status(400).json({
                    status: "error",
                    error: "Post must have a body or a painting.",
                });
            }

            let memoCdnKey = null;
            let paintingBuffer = null;

            let screenshotCdnKey = null;
            let screenshotBuffer = null;

            if (hasPainting) {
                try {
                    const base64Image = postForm.painting.replace(
                        /^data:image\/png;base64,/,
                        ""
                    );
                    paintingBuffer = Buffer.from(base64Image, "base64");

                    memoCdnKey = `${token.pid}_${Date.now()}.png`;
                    const bucketName = env.VINO_JP_MINIO_BUCKET;

                    const uploadParams = {
                        Bucket: bucketName,
                        Key: memoCdnKey,
                        Body: paintingBuffer,
                        ContentType: "image/png",
                        ACL: "public-read" as ObjectCannedACL,
                    };

                    await s3.send(new PutObjectCommand(uploadParams));
                    console.log(
                        `✅ PostAlt Memo PNG Uploaded ${memoCdnKey} to ${bucketName}`
                    );
                } catch (err) {
                    console.error(
                        "❌ PostAlt Error uploading PNG (memo):",
                        err
                    );
                    return res.status(500).json({
                        status: "error",
                        error: "Could not upload painting to CDN.",
                    });
                }
            }

            if (hasScreenshot) {
                try {
                    const base64Image = postForm.screenshot.replace(
                        /^data:image\/png;base64,/,
                        ""
                    );
                    screenshotBuffer = Buffer.from(base64Image, "base64");

                    screenshotCdnKey = `${token.pid}_${Date.now()}.png`;
                    const bucketName = env.VINO_JP_MINIO_BUCKET;

                    const uploadParams = {
                        Bucket: bucketName,
                        Key: screenshotCdnKey,
                        Body: screenshotBuffer,
                        ContentType: "image/png",
                        ACL: "public-read" as ObjectCannedACL,
                    };

                    await s3.send(new PutObjectCommand(uploadParams));
                    console.log(
                        `✅ PostAlt Screenshot PNG Uploaded ${memoCdnKey} to ${bucketName}`
                    );
                } catch (err) {
                    console.error(
                        "❌ PostAlt Error uploading PNG (screenshot):",
                        err
                    );
                    return res.status(500).json({
                        status: "error",
                        error: "Could not upload screenshot to CDN.",
                    });
                }
            }

            const post = await db("posts").insert({
                pid: account.pid,
                create_time: new Date(),
                search_keys: JSON.stringify(searchKeys),
                body: hasBody ? postForm.body : null,
                painting: memoCdnKey,
                screenshot: screenshotCdnKey,
                feeling_id: safeFeelingId,
                is_spoiler: safeIsSpoiler,
                topic_tag:
                    postForm.topic_tag && postForm.topic_tag.length
                        ? postForm.topic_tag
                        : "",
            });

            if (post && post.length > 0) {
                const postIdForLink = post[0];


                try {
                    const webhookUrl = env.VINO_JP_CONFIG_DC_WEBHOOK_URL;

                    const miiName = account.mii_name || "Unknown Mii";
                    const expression = expressionFromFeeling(feelingId);
                    const miiImageUrl = getMiiImageUrl(account.mii_data,
                      `type=face&width=128&expression=${expression}`);

                    const isSpoilerPost = safeIsSpoiler === 1;

                    let embed: any;

                    if (isSpoilerPost) {
                        embed = {
                            author: { name: miiName, icon_url: miiImageUrl },
                            title: postForm.topic_tag || "Untitled Topic",
                            url: `https://projectrose.cafe/tvii/olv/topic/${encodeURIComponent(postForm.topic_tag)}`,
                            description: `**[Spoiler, View in browser](https://projectrose.cafe/tvii/olv/post/${encodeURIComponent(postIdForLink!)})**`,
                            color: 0xe756d4,
                            timestamp: new Date().toISOString(),
                        };
                    } else {
                        let description = hasBody ? postForm.body : "";
                        description += `\n\n[View in browser](https://projectrose.cafe/tvii/olv/post/${encodeURIComponent(postIdForLink!)})`;

                        embed = {
                            author: { name: miiName, icon_url: miiImageUrl },
                            title: postForm.topic_tag || "Untitled Topic",
                            url: `https://projectrose.cafe/tvii/olv/topic/${encodeURIComponent(postForm.topic_tag)}`,
                            description,
                            color: 0xe756d4,
                            timestamp: new Date().toISOString(),
                        };

                        if (memoCdnKey) {
                            embed.image = {
                                url: `https://cdn.projectrose.cafe/tvii-jp-d1/${memoCdnKey}`,
                            };
                        } else if (screenshotCdnKey) {
                            embed.image = {
                                url: `https://cdn.projectrose.cafe/tvii-jp-d1/${screenshotCdnKey}`,
                            };
                        }
                    }

                    await fetch(webhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ embeds: [embed] }),
                    });
                } catch (err) {
                    console.error("❌ Failed to send Discord webhook:", err);
                }

                // Social posting logic
                if (hasBody && !hasPainting && !hasScreenshot) {
                    const bText = buildSocialPost(
                        300,
                        postForm.topic_tag,
                        postForm.body,
                        1
                    );

                    //Bsky
                    if (bskyAgent && resumedSession) {
                        try {
                            const bskyResult = await bskyAgent.sendPost(bText);
                            console.log("bsky text upload! ", bskyResult);
                        } catch (e) {
                            console.log("bsky text upload error: ", e);
                        }
                    }
                } else if (hasBody && hasScreenshot && screenshotBuffer) {
                    const bText = buildSocialPost(
                        300,
                        postForm.topic_tag,
                        postForm.body,
                        3
                    );
                    if (bskyAgent && resumedSession) {
                        try {
                            const bskyResult =
                                await bskyAgent.sendPostWithImage(
                                    bText,
                                    "User doodle from Nintendo TVii while watching " +
                                    postForm.topic_tag,
                                    screenshotBuffer
                                );
                            console.log("bsky doodle upload! ", bskyResult);
                        } catch (e) {
                            console.log("bsky doodle upload error: ", e);
                        }
                    }
                } else if (!hasBody && hasPainting && paintingBuffer) {
                    const bText = buildSocialPost(
                        300,
                        postForm.topic_tag,
                        null,
                        2
                    );

                    if (bskyAgent && resumedSession) {
                        try {
                            const bskyResult =
                                await bskyAgent.sendPostWithImage(
                                    bText,
                                    "User drawing from Nintendo TVii while watching " +
                                    postForm.topic_tag,
                                    paintingBuffer
                                );
                            console.log("bsky memo upload! ", bskyResult);
                        } catch (e) {
                            console.log("bsky memo upload error: ", e);
                        }
                    }
                }

                res.status(200).json({
                    status: "success",
                    post_id: postIdForLink,
                });
            } else {
                console.error("Post Insert failed");
                res.status(500).json({
                    status: "error",
                    error: "Post did not insert properly to DB.",
                });
            }
        } catch (error) {
            console.error("/postsAlt error:", error);
            res.status(500).json({
                status: "error",
                error: "Internal server error.",
            });
        }
    }
);

router.get("/postsAlt", async (req: Request, res: Response): Promise<any> => {
    try {
        const { limit, search_key, lastPostId } = req.query;

        if (!search_key || typeof search_key !== "string") {
            return res.status(400).json({
                status: "error",
                error: "A single search_key is required",
            });
        }

        const safeLimit = Math.min(parseInt(limit as string, 10) || 50, 200);

        // Build base query
        let query = db("posts")
            .innerJoin("account", "posts.pid", "account.pid")
            .whereRaw("JSON_VALID(posts.search_keys)")
            .andWhereRaw("JSON_CONTAINS(posts.search_keys, ?)", [
                `"${search_key}"`,
            ]);

        // Keyset pagination
        if (lastPostId) {
            query = query.andWhere("posts.post_id", "<", lastPostId);
        }

        const posts = await query
            .orderBy("posts.create_time", "desc")
            .limit(safeLimit)
            .leftJoin("empathies", "posts.post_id", "empathies.post_id")
            .leftJoin(
                { empathy_account: "account" },
                "empathies.pid",
                "empathy_account.pid"
            )
            .groupBy("posts.post_id")
            .select(
                "posts.post_id",
                "posts.pid",
                "posts.create_time",
                "posts.body",
                "posts.painting",
                "posts.screenshot",
                "posts.feeling_id",
                "posts.is_spoiler",
                "posts.search_keys",
                "posts.topic_tag",
                "account.mii_data",
                "account.mii_name",
                db.raw(`
                    COALESCE(
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'pid', empathy_account.pid,
                                'mii_name', empathy_account.mii_name,
                                'mii_data', empathy_account.mii_data
                            )
                            ORDER BY empathy_account.mii_name ASC
                        ),
                        JSON_ARRAY()
                    ) AS empathy_givers
                `)
            );

        const output = posts.map((post: any) => {
            const empathies: {
                pid: number | null;
                mii_name: string | null;
                mii_data: string | null;
            }[] = post.empathy_givers
                    ? JSON.parse(post.empathy_givers)
                    : [];

            return {
                post_id: post.post_id,
                pid: post.pid,
                create_time: post.create_time,
                body: post.body || null,
                painting: post.painting || null,
                screenshot: post.screenshot || null,
                feeling_id: post.feeling_id,
                is_spoiler: post.is_spoiler,
                topic_tag: post.topic_tag,
                mii_name: post.mii_name,
                mii_data: post.mii_data,
                empathies: empathies.filter(e => e.pid !== null),
            };
        });

        return res.status(200).json(output);
    } catch (error) {
        console.error("/postsAlt GET error:", error);
        return res.status(500).json({
            status: "error",
            error: "Internal server error.",
        });
    }
});



router.post(
    "/postsAlt/:postId/empathies",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);
            const postId = Number(req.params["postId"]);

            const post = await db("posts").where({ post_id: postId }).first();

            if (!post) {
                return res.status(404).json({ error: "Post not found." });
            }

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(401).json({ status: "no_account_yet" });
            }

            const existing = await db("empathies")
                .where({ pid: account.pid, post_id: postId })
                .first();

            if (existing) {
                //what the miiverse yeah endpoint does anyway
                return res.status(200).json({ status: "success" });
            }

            await db("empathies").insert({
                pid: account.pid,
                post_id: postId,
                create_time: new Date(),
            });

            res.status(200).json({ status: "success" });
        } catch (e) {
            console.error("error yeah-ing post");
            res.status(500).json({ status: "error" });
        }
    }
);

router.delete(
    "/postsAlt/:postId/empathies",
    async (req: Request, res: Response): Promise<any> => {
        try {
            const token = parseServiceToken(req);

            const postId = Number(req.params["postId"]);

            const post = await db("posts").where({ post_id: postId }).first();

            if (!post) {
                return res.status(404).json({ error: "Post not found." });
            }

            const account = await db("account")
                .where({
                    pid: token.pid,
                    serial_number: token.serial_number,
                    access_key: token.access_key,
                })
                .first();

            if (!account) {
                return res.status(401).json({ status: "no_account_yet" });
            }

            const existing = await db("empathies")
                .where({ pid: account.pid, post_id: postId })
                .first();

            if (!existing) {
                // is this the right error code?
                return res.status(500).json({ status: "empathy does not exist" });
            }

            await db("empathies")
                .where({ pid: account.pid, post_id: postId })
                .del();

            res.status(200).json({ status: "success" });
        } catch (e) {
            console.error("error un-yeah-ing post");
            res.status(500).json({ status: "error" });
        }
    }
);

export { router as socials };

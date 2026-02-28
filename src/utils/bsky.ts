import { AtpAgent, RichText } from "@atproto/api";
import type { AtpSessionEvent, AtpSessionData } from "@atproto/api";
import type { Record as FeedPostRecord } from "@atproto/api/dist/client/types/app/bsky/feed/post";

export class BskyClient {
    agent: AtpAgent;
    private session?: AtpSessionData;

    private resolvePersist?: (s: AtpSessionData) => void;
    private rejectPersist?: (err: any) => void;

    constructor() {
        this.agent = new AtpAgent({
            service: "https://bsky.social",
            persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
                console.log("Persisting session:", evt);
                if (sess) {
                    this.session = sess;
                    this.resolvePersist?.(this.session);
                } else {
                    this.rejectPersist?.(new Error("Session data missing."));
                }
            },
        });
    }

    async login(username: string, password: string): Promise<AtpSessionData> {
        // Wait for persistSession callback
        const persistPromise = new Promise<AtpSessionData>(
            (resolve, reject) => {
                this.resolvePersist = resolve;
                this.rejectPersist = reject;
            }
        );

        await this.agent.login({ identifier: username, password });
        const session = await persistPromise;
        return session;
    }

    async sendPost(text: string) {
        const rt = new RichText({ text });
        await rt.detectFacets(this.agent);

        const postRecord: FeedPostRecord = {
            $type: "app.bsky.feed.post",
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
        };

        return await this.agent.post(postRecord);
    }

    async sendPostWithImage(
        text: string,
        altDescription: string,
        imageBuffer: Buffer
    ) {
        const rt = new RichText({ text });
        await rt.detectFacets(this.agent);

        const blob = await this.agent.uploadBlob(imageBuffer, {
            encoding: "image/png",
        });

        const postRecord: FeedPostRecord = {
            $type: "app.bsky.feed.post",
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
            embed: {
                $type: "app.bsky.embed.images",
                images: [
                    {
                        alt: altDescription,
                        image: blob.data.blob,
                    },
                ],
            },
        };

        return await this.agent.post(postRecord);
    }
}

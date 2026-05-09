export interface MiiResponse {
    /** Principal ID. */
    pid: string;
    /** Mii name. */
    name: string;
    /** 96-byte Base64 encoded Mii data. */
    data: string;
    /** Nintendo Network ID. */
    userId: string;
}

/** Ad-hoc method of extracting XML tag value. */
function extractXmlTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
    return match?.[1] ?? "";
}

/**
 * Minimal client for Nintendo Network Account System/Server/Service/whatever it's called.
 * It only:
 * - Resolves User ID -> PID
 * - Obtains /v1/api/miis response
 * - Does not send client certificate (meaning it only works on custom servers)
 */
export default class NnasClient {
    /**
     * API base: {@link https://pretendo.network}
     * As of writing, this blocks HTTP/2 clients and
     * may break if Bun fetch gets H2 support.
     */
    private static readonly baseUrl = "https://account.pretendo.cc/v1/api";

    /**
     * Headers including the Wii U client ID/secret.
     * {@link https://github.com/kinnay/NintendoClients/wiki/Account-Server#headers}
     */
    private static readonly headers: Record<string, string> = {
        "Accept": "application/xml",
        "X-Nintendo-Client-ID": "a2efa818a34fa16b8afbc8a74eba3eda",
        "X-Nintendo-Client-Secret": "c91cdb5658bd4954ade78533a339cf9a",
    };

    /**
     * Obtains PID as a string from the user ID.
     * Throws an exception if user doesn't exist.
     */
    static async pidFromUserId(userId: string): Promise<string> {
        const resp = await fetch(
            `${NnasClient.baseUrl}/admin/mapped_ids?input_type=user_id&output_type=pid&input=${encodeURIComponent(userId)}`,
            { headers: NnasClient.headers }
        );
      if (!resp.ok) {
          throw new Error(`mapped_ids fetch failed: ${resp.status}`);
      }
      const body = await resp.text();
      const pid = extractXmlTag(body, "out_id");
      if (!pid) {
          throw new Error("User not found");
      }
      return pid;
    }

    /**
     * Obtains {@link MiiResponse} from the PID.
     * Throws an exception if user doesn't exist.
     */
     static async miiFromPid(pid: string): Promise<MiiResponse> {
        const resp = await fetch(
            `${NnasClient.baseUrl}/miis?pids=${pid}`,
            { headers: NnasClient.headers }
        );
        if (!resp.ok) {
            throw new Error(`miis fetch failed: ${resp.status}`);
        }
        const body = await resp.text();
        const mii: Partial<MiiResponse> = {
              pid: extractXmlTag(body, "pid"),
              name: extractXmlTag(body, "name"),
              data: extractXmlTag(body, "data"),
              userId: extractXmlTag(body, "user_id"),
        };
        if (!mii.data) {
            throw new Error("no mii data in response");
        }
        return mii as MiiResponse;
    }
}

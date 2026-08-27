/**
 * @file NnidResolver.mjs
 * Obtained from: https://gist.github.com/ariankordi/0348465eaa2d4c5b95fddd0c00b36795
 * Simple class for retrieving information about Nintendo
 * Network IDs/Pretendo Network IDs and their Mii data.
 * Uses fetch() API in Node, Bun, and web.
 *
 * In the browser, you will need to use a CORS proxy
 * or create your own reverse proxy to the actual API.
 * The following is an example of how to set up a basic proxy
 * using mitmdump, but you can redo this in nginx, Express.js, etc.
 * @example
 *
 * // Install mitmproxy and run:
 * `mitmdump --no-http2 --mode reverse:https://account.pretendo.cc --listen-port 8282 --modify-headers "/Access-Control-Allow-Origin/*" --modify-headers "/Access-Control-Allow-Headers/X-Nintendo-Client-ID,X-Nintendo-Client-Secret" --set "block_list=/~m OPTIONS/200"`
 * NnidResolver.baseUrl = 'https://localhost:8282/v1/api';
 * console.debug(await NnidResolver.miiFromPid('1742653218'));
 * @author Arian Kordi <https://github.com/ariankordi>
 */
// @ts-check
/* eslint @stylistic/indent: ['error', 2] -- Indent rules. */

/**
 * Response from the /v1/api/miis endpoint.
 * @typedef {Object} MiiResponse
 * @property {string} pid Principal ID.
 * @property {string} name Name of the user's Mii character.
 * @property {string} miiData Mii data encoded as Base64. (96 bytes, 3DS/Wii U format)
 * @property {string} userId Nintendo Network ID username.
 */

/**
 * Resolves user data ({@link MiiResponse}) from NNAS, aka
 * Nintendo Network Account Server/Service/System (Wii U/3DS).
 *
 * Only supports unofficial services, defaulting to {@link https://pretendo.network}.
 * @example
 *
 * console.debug(await NnidUserResolver.miiFromPid(await NnidUserResolver.pidFromUserId('PN_Jon')));
 */
export default class NnidResolver {
  /**
   * API base for Pretendo Network.
   * Note that this blocks HTTP/2 clients, and a workaround for Bun is applied.
   */
  static baseUrl = 'https://account.pretendo.cc/v1/api';
  // account.nintendo.net would require a client certificate, however
  // its /v1/api/miis endpoint stopped working in 2024.

  /** @private */ static _get = (/** @type {string} */ url) =>
    fetch(url, {
      headers: {
        'Accept': '*/*', // account.nintendo.net optionally accepts JSON.
        'X-Nintendo-Client-ID': 'a2efa818a34fa16b8afbc8a74eba3eda',
        'X-Nintendo-Client-Secret': 'c91cdb5658bd4954ade78533a339cf9a'
      },
      // Force HTTP 1.1: https://github.com/oven-sh/bun/blob/450072ba3eaadaa40ff3104a14173e73f5c5b83f/packages/bun-types/globals.d.ts#L2004-L2016
      // @ts-ignore -- This property is specific to Bun.
      protocol: 'http1.1'
    }).then((r) => {
      // Only return if the response is OK and contains XML like expected.
      // account.nintendo.net: application/xml;charset=UTF-8
      // account.pretendo.cc: text/xml; charset=utf-8
      if (r.ok && r.headers.get('content-type')?.includes('/xml')) {
        return r.text();
      }
      throw r; // Reject when response is not OK.
    });

  /**
   * Ad-hoc/amateur method of extracting XML tag value.
   * Does NOT un-escape any characters, or handle multi-line XML.
   * @private
   */
  static _extractXmlTag = (/** @type {string} */ doc, /** @type {string} */ tag) =>
    doc.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`))?.[1] || '';

  /** @private */ static _nameFromMiiDataBase64 = (/** @type {string} */ miiData) =>
    // Decode Base64, decode UTF-16LE from bytes @ 0x1A + 20 chars, return text before NULL terminator.
    new TextDecoder('utf-16le').decode(Uint8Array.from(atob(miiData), c => c.charCodeAt(0)).subarray(26, 46)).split('\0')[0];

  /**
   * Obtains PID (principal ID) as a string from the user ID.
   * @throws {Error} Throws if the user does not exist.
   * @throws {Response} Throws for all other HTTP errors.
   */
  static async pidFromUserId(/** @type {string} */ userId,
    /** @type {string} */ base = NnidResolver.baseUrl) {
    const body = await NnidResolver._get(base + '/admin/mapped_ids?input_type=user_id&output_type=pid&input=' + encodeURIComponent(userId));
    const pid = NnidResolver._extractXmlTag(body, 'out_id');
    if (!pid) {
      throw new Error('User not found.');
    }
    return pid;
  }

  /**
   * Obtains {@link MiiResponse} from the PID.
   * Throws an exception if user doesn't exist.
   * @throws {Response} Throws if the PID does not exist,
   * or for any other HTTP error.
   * @throws {Error} Throws if the Mii data is empty.
   */
  static async miiFromPid(/** @type {string} */ pid,
    /** @type {string} */ base = NnidResolver.baseUrl) {
    const body = await NnidResolver._get(base + '/miis?pids=' + pid);

    const miiData = NnidResolver._extractXmlTag(body, 'data');
    if (!miiData) { // For a non-existent user, we should instead see 404.
      throw new Error('Mii data is unexpectedly empty in response.');
    }
    // 'name' is the only field escaped with XML entities - NOTHING else should ever have them.
    // Due to ease + a Pretendo bug (https://github.com/PretendoNetwork/account/issues/122),
    // the name will instead be decoded from the Mii data.
    const name = NnidResolver._nameFromMiiDataBase64(miiData);

    // NOTE: No fields except for name should ever contain XML entities.
    return /** @type {MiiResponse} */ ({
      pid: NnidResolver._extractXmlTag(body, 'pid'),
      name, miiData,
      userId: NnidResolver._extractXmlTag(body, 'user_id')
    });
  }
}

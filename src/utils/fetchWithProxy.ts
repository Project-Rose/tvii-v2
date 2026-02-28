const userAgentTemplates: string[] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_{RAND}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.{RAND} Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 13; Pixel {RAND}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_{RAND} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.{RAND} Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{FIREFOX_VERSION}) Gecko/20100101 Firefox/{FIREFOX_VERSION}",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Safari/537.36",
];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomUserAgent(): string {
    const chromeVersion = `${getRandomInt(113, 120)}.0.${getRandomInt(5000, 5999)}.${getRandomInt(100, 999)}`;
    const firefoxVersion = `${getRandomInt(100, 120)}.0`;
    const rand = getRandomInt(1, 9);

    return getRandom(userAgentTemplates)
        .replace(/{CHROME_VERSION}/g, chromeVersion)
        .replace(/{FIREFOX_VERSION}/g, firefoxVersion)
        .replace(/{RAND}/g, String(rand));
}

export async function fetchWithProxy(url: string, headers: Record<string, string> = {}, allowRedirects: boolean = true): Promise<Response> {
    const userAgent = generateRandomUserAgent();

    // random delay before request
    console.log(url)

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": userAgent,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                Connection: "keep-alive",
                ...headers, // merge additional headers
            },
            redirect: allowRedirects ? "follow" : "manual",
        });

        if (!allowRedirects) {
            return response;
        }

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response;
    } catch (error: any) {
        console.error(`⚠️ fetchWithProxy failed: ${error.message}`);
        throw error; // do not retry
    }
}

export async function postWithProxy(url: string, body: string | Record<string, any> | URLSearchParams, headers: Record<string, string> = {}): Promise<Response> {
    const userAgent = generateRandomUserAgent();

    let finalBody: string | URLSearchParams;
    let contentType = headers["Content-Type"];

    if (body instanceof URLSearchParams) {
        finalBody = body;
        contentType ??= "application/x-www-form-urlencoded";
    } else if (typeof body === "string") {
        finalBody = body;
        contentType ??= "application/x-www-form-urlencoded";
    } else {
        finalBody = JSON.stringify(body);
        contentType ??= "application/json";
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "User-Agent": userAgent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
                "Content-Type": contentType,
                ...headers,
            },
            body: finalBody,
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response;
    } catch (error: any) {
        console.error(`⚠️ postWithProxy failed: ${error.message}`);
        throw error; // do not retry
    }
}

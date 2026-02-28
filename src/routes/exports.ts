import { vinoRoute as vino } from "../routes/ui/vino-jp.ts";
import { vinoDebug } from "../routes/ui/debug.ts";
import { providers } from "../routes/api/providers.ts";
import { programs } from "../routes/api/programs.ts";
import { miis } from "../routes/api/miis.ts";
import { images } from "../routes/images.ts";
import { socials } from "../routes/api/social.ts";
import { account } from "../routes/api/act.ts";
import { miiverse } from "../routes/api/miiverseFw.ts";
import { title } from "../routes/api/title.ts";
import { type Router } from "express";

interface Routes {
    name: string;
    path: string;
    route: Router;
}

const routes: Routes[] = [
    {
        name: "Vino UI (JP)",
        path: "/",
        route: vino,
    },
    {
        name: "Debug Vino UI (JP)",
        path: "/debug",
        route: vinoDebug,
    },
    {
        name: "Vino API Providers (JP)",
        path: "/api/v1/providers",
        route: providers,
    },
    {
        name: "Vino API Programs (JP)",
        path: "/api/v1/programs",
        route: programs,
    },
    {
        name: "Vino API Miis (JP)",
        path: "/api/v1/miis.png",
        route: miis,
    },
    {
        name: "Vino TV Guide Images (JP)",
        path: "/images",
        route: images,
    },
    {
        name: "Vino Social Media (JP)",
        path: "/api/v1/socials",
        route: socials,
    },
    {
        name: "Vino Title Image Generator (JP)",
        path: "/api/v1/title",
        route: title,
    },
    {
        name: "Vino Account Handler (JP)",
        path: "/api/v1/act",
        route: account,
    },
    {
        name: "Vino Miiverse Forwarder (JP)",
        path: "/api/v1/olvapi",
        route: miiverse,
    },
];

export { routes as exports };

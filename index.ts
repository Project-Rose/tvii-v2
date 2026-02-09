import express, { type Application } from "express";
import { env } from "./src/env.ts";
import { access } from "./src/middleware/access.ts";
import { join } from "path";
import { exports } from "./src/routes/exports.ts";
import { logger } from "./src/utils/logger.ts";

const app: Application = express();
const port: number = env.VINO_JP_CONFIG_PORT;

// Middleware
app.use(access);
app.set("view engine", "ejs");

app.set("views", __dirname + "/pages");

app.use(express.static(join(__dirname, "static"))); // Serves our static files

app.disable("X-Powered-By");

// Auto imports routes instead of import of bunch manually
for (let i = 0; i < exports.length; i++) {
    const route = exports[i];
    app.use(route!.path, route!.route);
    logger.success(
        `Successfully imported '${route!.name}' routes at '${route!.path}'!`
    );
}


// Starts the server
app.listen(port, () => {
    logger.info("Server is running on port: %d!", port);
});

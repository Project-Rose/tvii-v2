import chalk from "chalk";
import util from "util";

const getTime = (): string => {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
};

export const logger = {
    /**
     * Logs a blue message to the console - logger.log();
     * @param { string } msg - The message you would like to log
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    log: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.blueBright(
                `[LOG ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
    /**
     * Logs a cyan message to the console - logger.info();
     * @param { string } msg - The message you would like to log
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    info: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.cyanBright(
                `[INFO ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
    /**
     * Logs a green message to the console - logger.success();
     * @param { string } msg - The message you would like to loglog
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    success: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.greenBright(
                `[SUCCESS ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
    /**
     * Logs a red message to the console - logger.error();
     * @param { string } msg - The message you would like to log
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    error: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.redBright(
                `[ERROR ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
    /**
     * Logs a yellow warning message to the console - logger.warn();
     * @param { string } msg - The message you would like to log
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    warn: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.yellowBright(
                `[WARN ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
    /**
     * Logs a yellow attempting message to the console - logger.attempt();
     * @param { string } msg - The message you would like to log
     * @param { unknown } args - Adds support for C-like stuff (e.g. %s)
     */
    attempt: (msg: string, ...args: unknown[]): void => {
        console.log(
            chalk.bold.yellowBright(
                `[ATTEMPT ${getTime()}] ${util.format(msg, ...args)}`
            )
        );
    },
};

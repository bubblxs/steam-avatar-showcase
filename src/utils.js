require("dotenv").config();

module.exports = {
    isDevEnv: () => {
        return process.env.NODE_ENV === "dev";
    },

    log: (message, logType = "Log", exit = false) => {
        const ANSI_COLOR = {
            red: "\x1b[31m",
            white: "\x1b[37m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
        };

        let logMessage = (() => {
            const date = new Date();

            return `[${date.toLocaleDateString()} - ${date.toLocaleTimeString()}]`
        })();

        switch (logType) {
            case "Error":
                logMessage += `${ANSI_COLOR.red} [X] ...`;
                break;
            case "Success":
                logMessage += `${ANSI_COLOR.green} [+] ...`;
                break;
            case "Warning":
                logMessage += `${ANSI_COLOR.yellow} [!] ...`;
                break;
            default:
                logMessage += `${ANSI_COLOR.white} [-] ...`;
                break;
        }

        console.log(`${logMessage} ${message} ${ANSI_COLOR.white}`);

        if (exit) {
            process.exit(logType === "Error" ? 1 : 0);
        }
    },

    waitSeconts: (seconds) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(`we waited for ${seconds} seconds. yay!`)
            }, seconds * 1000);
        });
    }
}
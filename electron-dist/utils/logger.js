/**
 * Logger para o processo main do Electron.
 * Em produção, debug/info não imprimem nada.
 * warn/error imprimem apenas em desenvolvimento.
 */
const isProduction = process.env.NODE_ENV === "production";
const isDev = !isProduction;
function formatMessage(tag, ...args) {
    const prefix = tag ? `[LociOne][${tag}]` : "[LociOne]";
    return [prefix, ...args];
}
export const logger = {
    debug: (...args) => {
        if (isDev) {
            console.log(...formatMessage(undefined, ...args));
        }
    },
    debugTag: (tag, ...args) => {
        if (isDev) {
            console.log(...formatMessage(tag, ...args));
        }
    },
    info: (...args) => {
        if (isDev) {
            console.info(...formatMessage(undefined, ...args));
        }
    },
    infoTag: (tag, ...args) => {
        if (isDev) {
            console.info(...formatMessage(tag, ...args));
        }
    },
    warn: (...args) => {
        if (isDev) {
            console.warn(...formatMessage(undefined, ...args));
        }
    },
    warnTag: (tag, ...args) => {
        if (isDev) {
            console.warn(...formatMessage(tag, ...args));
        }
    },
    error: (...args) => {
        // Erros sempre são logados, mas só imprimem em dev
        if (isDev) {
            console.error(...formatMessage(undefined, ...args));
        }
    },
    errorTag: (tag, ...args) => {
        // Erros sempre são logados, mas só imprimem em dev
        if (isDev) {
            console.error(...formatMessage(tag, ...args));
        }
    },
};

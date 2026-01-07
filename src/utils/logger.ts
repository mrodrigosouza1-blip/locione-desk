/**
 * Logger centralizado para o aplicativo.
 * Em produção, debug/info não imprimem nada.
 * warn/error imprimem apenas em desenvolvimento.
 */

const isProduction = process.env.NODE_ENV === "production";
const isDev = !isProduction;

function formatMessage(tag?: string, ...args: any[]): any[] {
  const prefix = tag ? `[LociOne][${tag}]` : "[LociOne]";
  return [prefix, ...args];
}

export const logger = {
  debug: (...args: any[]): void => {
    if (isDev) {
      console.log(...formatMessage(undefined, ...args));
    }
  },

  debugTag: (tag: string, ...args: any[]): void => {
    if (isDev) {
      console.log(...formatMessage(tag, ...args));
    }
  },

  info: (...args: any[]): void => {
    if (isDev) {
      console.info(...formatMessage(undefined, ...args));
    }
  },

  infoTag: (tag: string, ...args: any[]): void => {
    if (isDev) {
      console.info(...formatMessage(tag, ...args));
    }
  },

  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...formatMessage(undefined, ...args));
    }
  },

  warnTag: (tag: string, ...args: any[]): void => {
    if (isDev) {
      console.warn(...formatMessage(tag, ...args));
    }
  },

  error: (...args: any[]): void => {
    // Erros sempre são logados, mas só imprimem em dev
    if (isDev) {
      console.error(...formatMessage(undefined, ...args));
    }
  },

  errorTag: (tag: string, ...args: any[]): void => {
    // Erros sempre são logados, mas só imprimem em dev
    if (isDev) {
      console.error(...formatMessage(tag, ...args));
    }
  },
};


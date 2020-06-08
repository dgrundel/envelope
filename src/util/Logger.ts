export class Logger {
    info(...args: any[]) {
        console.log(...args);
    }

    warn(...args: any[]) {
        console.warn(...args);
    }

    error(...args: any[]) {
        console.error(...args);
    }
}

export const Log = new Logger();
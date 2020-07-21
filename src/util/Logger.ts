import { isDevelopment } from './Environment';

export class Logger {
    debug(...args: any[]) {
        if (isDevelopment()) {
            console.log('DEBUG', ...args);
        }
    }

    info(...args: any[]) {
        console.log('INFO', ...args);
    }

    warn(...args: any[]) {
        console.warn('WARN', ...args);
    }

    error(...args: any[]) {
        console.error('ERROR', ...args);
        console.trace();
    }

    andThrow(error: string | Error) {
        const e = typeof error === 'string' ? new Error(error) : error;
        this.error(e);
        throw e;
    }
}

export const Log = new Logger();
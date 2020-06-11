export class Logger {
    debug(...args: any[]) {
        if (process.env.NODE_ENV !== 'production') {
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
}

export const Log = new Logger();
import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { Log } from '@/util/Logger';
import { resolve } from 'dns';

const ENCODING = 'utf8';
const SAVE_THROTTLE_TIMEOUT = 5 * 1000;

export interface StorageApi {
    get: (key: string) => Promise<string>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
    save(): Promise<void>;
}

export class StorageHost implements StorageApi {
    private readonly name: string;
    private readonly filePath: string;
    private data: any = {};
    private queue: Promise<any>;
    
    private lastSave: number = 0;
    private saveTimeout?: NodeJS.Timeout;

    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(app.getPath('userData'), `${name}.json`);
        this.queue = this.load();
    }

    private load(): Promise<void> {
        return new Promise(resolve => {
            fs.access(this.filePath, fs.constants.F_OK, err => err ? resolve(false) : resolve(true));
        })
        .then((fileExists: boolean) => {
            if (fileExists) {
                // file exists
                return fs.promises.readFile(this.filePath, { encoding: ENCODING })
                    .then(json => {
                        this.data = JSON.parse(json);
                    })
                    .catch(err => {
                        Log.error(err);
                    });
            }
        });
    }

    private write(): Promise<void> {
        const json = JSON.stringify(this.data);
        return fs.promises.writeFile(this.filePath, json, { encoding: ENCODING });
    }

    private throttledSave(): Promise<void> {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        const elapsedTime = Date.now() - this.lastSave;
        if (elapsedTime > SAVE_THROTTLE_TIMEOUT) {
            // actually save the data
            const json = JSON.stringify(this.data);
            return this.write().then(() => { this.lastSave = Date.now() });
                
        } else {
            this.saveTimeout = setTimeout(this.write.bind(this), SAVE_THROTTLE_TIMEOUT - elapsedTime);
            return Promise.resolve();
        }
    }

    save(): Promise<void> {
        return this.queue = this.queue
            .then(() => this.write());
    }

    get(key: string): Promise<string> {
        return this.queue = this.queue
            .then(() => this.data[key]);
    }

    set(key: string, value: string): Promise<void> {
        return this.queue = this.queue
            .then(() => {
                this.data[key] = value;
                return this.throttledSave();
            });
    }

    remove(key: string): Promise<void> {
        return this.queue = this.queue
            .then(() => {
                delete this.data[key];
                return this.throttledSave();
            });
    }
}
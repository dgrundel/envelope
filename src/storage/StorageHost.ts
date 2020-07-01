import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { Log } from '@/util/Logger';
import { resolve } from 'dns';

const ENCODING = 'utf8';
const BACKUP_SUFFIX = '.bak';

export interface StorageApi {
    get: (key: string) => Promise<string>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
}

export class StorageHost implements StorageApi {
    private readonly name: string;
    private readonly filePath: string;
    private data: any = {};
    private _queue: Promise<any>;

    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(app.getPath('userData'), `${name}.json`);
        this._queue = this.load();
    }

    load(): Promise<void> {
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

    save(): Promise<void> {
        const json = JSON.stringify(this.data);
        return fs.promises.writeFile(this.filePath, json, { encoding: ENCODING });
    }

    get(key: string): Promise<string> {
        return this._queue = this._queue
            .then(() => this.data[key]);
    }

    set(key: string, value: string): Promise<void> {
        return this._queue = this._queue
            .then(() => {
                this.data[key] = value;
                return this.save();
            });
    }

    remove(key: string): Promise<void> {
        return this._queue = this._queue
            .then(() => {
                delete this.data[key];
                return this.save();
            });
    }
}
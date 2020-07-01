import { Log } from '@/util/Logger';
import { app, ipcMain, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const ENCODING = 'utf8';

export interface StorageApi {
    getItem: (key: string) => Promise<string>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
}

export interface StorageHostApi extends StorageApi {
    save: () => Promise<void>;
}

enum StorageEvent {
    Get = 'storage-event:get',
    Set = 'storage-event:set',
    Remove = 'storage-event:remove',
}

interface IPCResult {
    success: boolean;
    data: any;
}

const buildEventName = (event: StorageEvent, name: string) => `${name}#${event}`;

const getSerializableError = (err: Error) => Object.getOwnPropertyNames(err)
    .reduce((serializable: any, prop: string) => {
        serializable[prop] = (err as any)[prop]
        return serializable;
    }, {});

class StorageHost implements StorageHostApi {
    private readonly name: string;
    private readonly filePath: string;
    private data: any;
    private ready: Promise<void>;
    
    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(app.getPath('userData'), `${name}.json`);
        this.ready = this.load();
        this.listen();
    }

    private load(): Promise<void> {
        return new Promise(resolve => {
            let data = {};
            let fileExists = true;
            try {
                fs.accessSync(this.filePath, fs.constants.F_OK);
            } catch (e) {
                fileExists = false;
            }
            
            if (fileExists) {
                try {
                    const json = fs.readFileSync(this.filePath, { encoding: ENCODING });
                    data = JSON.parse(json);
                } catch (e) {
                    Log.error('Error while loading data file', this.filePath, e);
                }
            }
            resolve(data);
        }).then(data => {
            this.data = data;
        });
    }

    private handle(event: StorageEvent, callback: (...args: any) => Promise<any>) {
        const channel = buildEventName(event, this.name);
        ipcMain.handle(channel, (...args: any) => new Promise((resolve) => {
            callback(...args)
                .then(result => resolve({
                    success: true,
                    data: result
                }))
                .catch(reason => resolve({
                    success: false,
                    data: getSerializableError(reason)
                }));
        }));
    }

    private listen() {
        this.handle(StorageEvent.Get, this.getItem.bind(this));
        this.handle(StorageEvent.Set, this.setItem.bind(this));
        this.handle(StorageEvent.Remove, this.removeItem.bind(this));
    }

    save(): Promise<void> {
        const json = JSON.stringify(this.data);
        return fs.promises.writeFile(this.filePath, json, { encoding: ENCODING });
    }

    getItem(key: string): Promise<string> {
        return this.ready.then(() => this.data[key]);
    }

    setItem(key: string, value: string): Promise<void> {
        return this.ready.then(() => {
            this.data[key] = value;
        });
    }

    removeItem(key: string): Promise<void> {
        return this.ready.then(() => {
            delete this.data[key];
        });
    }
}

class StorageClient implements StorageApi {
    private readonly name: string;
    
    constructor(name: string) {
        this.name = name;
    }

    private invoke(event: StorageEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    getItem(key: string): Promise<string> {
        return this.invoke(StorageEvent.Get, key);
    }

    setItem(key: string, value: string): Promise<void> {
        return this.invoke(StorageEvent.Set, key, value);
    }

    removeItem(key: string): Promise<void> {
        return this.invoke(StorageEvent.Remove, key);
    }
}

const DATA_FILE_NAME = 'envelope-app-data';
export const getAppStorageHost = (): StorageHostApi => new StorageHost(DATA_FILE_NAME);
export const getAppStorageClient = (): StorageApi => new StorageClient(DATA_FILE_NAME)
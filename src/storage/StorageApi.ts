import { Log } from '@/util/Logger';
import { app, ipcMain, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const ENCODING = 'utf8';

export interface StorageApi {
    get: (key: string) => Promise<string>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
}

enum StorageEvent {
    Get = 'storage-event:get',
    Set = 'storage-event:set',
    Remove = 'storage-event:remove',
};

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

export class StorageHost implements StorageApi {
    private readonly name: string;
    private readonly filePath: string;
    private data: any;
    
    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(app.getPath('userData'), `${name}.json`);
        this.data = this.load();

        this.listen();
    }

    private load(): any {
        let fileExists = true;
        try {
            fs.accessSync(this.filePath, fs.constants.F_OK);
        } catch (e) {
            fileExists = false;
        }
        
        if (fileExists) {
            try {
                const json = fs.readFileSync(this.filePath, { encoding: ENCODING });
                return JSON.parse(json);
            } catch (e) {
                Log.error('Error while loading data file', this.filePath, e);
            }
        }
        return {};        
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
        this.handle(StorageEvent.Get, this.get);
        this.handle(StorageEvent.Set, this.set);
        this.handle(StorageEvent.Remove, this.remove);
    }

    save(): Promise<void> {
        const json = JSON.stringify(this.data);
        return fs.promises.writeFile(this.filePath, json, { encoding: ENCODING });
    }

    get(key: string): Promise<string> {
        return Promise.resolve(this.data[key]);
    }

    set(key: string, value: string): Promise<void> {
        return new Promise(resolve => {
            this.data[key] = value;
            resolve();
        });
    }

    remove(key: string): Promise<void> {
        return new Promise(resolve => {
            delete this.data[key];
            resolve();
        });
    }
}

export class StorageClient implements StorageApi {
    private readonly name: string;
    
    constructor(name: string) {
        this.name = name;
    }

    private invoke(event: StorageEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    get(key: string): Promise<string> {
        return this.invoke(StorageEvent.Get, key);
    }

    set(key: string, value: string): Promise<void> {
        return this.invoke(StorageEvent.Set, key, value);
    }

    remove(key: string): Promise<void> {
        return this.invoke(StorageEvent.Remove, key);
    }
}
import { app, ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import * as path from 'path';
import * as Nedb from 'nedb';
import { Log } from '@/util/Logger';

const dataStores: Record<string, DataStore<any>> = {};

export enum DataStoreEvent {
    Changed = 'datastore-changed',
    Insert = 'datastore-insert',
    InsertMany = 'datastore-insert-many',
    Update = 'datastore-update',
    Find = 'datastore-find',
    FindOne = 'datastore-find-one',
}

export enum DataStoreChange {
    Insert = 'datastore-insert',
    Update = 'datastore-update'
}

export const buildEventName = (event: DataStoreEvent, name: string) => `${event}:${name}`;

export interface BaseDataStoreRecord {
    _id?: string;
};

interface IPCResult {
    success: boolean;
    data: any;
}

const getSerializableError = (err: Error) => Object.getOwnPropertyNames(err)
    .reduce((serializable: any, prop: string) => {
        serializable[prop] = (err as any)[prop]
        return serializable;
    }, {});

abstract class BaseDataStore<T extends BaseDataStoreRecord> {
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    protected buildEventName(event: DataStoreEvent, name: string) {
        return `${event}:${name}`;
    }

    protected abstract insert(item: T): Promise<T>;
    protected abstract find(query?: any): Promise<T[]>;
}

export class DataStore<T extends BaseDataStoreRecord> extends BaseDataStore<T> {
    private readonly db: Nedb<T>;

    constructor(name: string) {
        super(name);

        if (dataStores.hasOwnProperty(name)) {
            throw new Error(`A data store already exists with the name: ${name}`);
        }

        const filePath = path.join(app.getPath('userData'), `${name}.db`);
        Log.info(`Initializing '${name}' database at ${filePath}`);

        this.db = new Nedb({
            filename: filePath,
            autoload: true,
            corruptAlertThreshold: 0
        });

        this.handle(DataStoreEvent.Insert, (event, item: T) => {
            return this.insert(item);
        });
        this.handle(DataStoreEvent.InsertMany, (event, items: T[]) => {
            return this.insertMany(items);
        });
        this.handle(DataStoreEvent.Update, (event, query: any, update: any, options: Nedb.UpdateOptions) => {
            return this.update(query, update, options);
        });
        this.handle(DataStoreEvent.Find, (event, query?: any, sort?: any) => {
            return this.find(query, sort);
        });
    }

    private handle(event: DataStoreEvent, callback: (...args: any) => Promise<any>) {
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

    protected triggerChanged(change: DataStoreChange) {
        BrowserWindow.getAllWindows()
            .forEach(win => win.webContents.send(buildEventName(DataStoreEvent.Changed, this.name), change));
    }

    protected index(options: Nedb.EnsureIndexOptions) {
        this.db.ensureIndex(options, err => err && Log.error(`Error while adding index in database ${this.name}`, options, err));
    }

    protected insert(item: T): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.insert(item, (err: Error, document: T) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Insert);
                    resolve(document);
                }
            });
        });
    }

    protected insertMany(items: T[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.insert(items, (err: Error, documents: T[]) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Insert);
                    resolve(documents);
                }
            });
        });
    }

    protected update(query: any, update: any, options: Nedb.UpdateOptions = {}): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.update(query, update, options, (err: Error, numUpdated: number) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Update);
                    resolve(numUpdated);
                }
            });
        });
    }

    protected find(query: any = {}, sort?: any): Promise<T[]> {
        return new Promise((resolve, reject) => {
            let cursor = this.db.find(query);

            if (sort) {
                cursor = cursor.sort(sort);
            }

            cursor.exec((err: Error, documents: T[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(documents);
                }
            });
        });
    }

    protected findOne(query: any = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.findOne(query, (err: Error, document: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(document);
                }
            });
        });
    }
}

export class DataStoreClient<T extends BaseDataStoreRecord> extends BaseDataStore<T> {
    private invoke(event: DataStoreEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    protected insert(item: T): Promise<T> {
        return this.invoke(DataStoreEvent.Insert, item);
    }

    protected insertMany(items: T[]): Promise<T[]> {
        return this.invoke(DataStoreEvent.InsertMany, items);
    }

    protected update(query: any, update: any, options: Nedb.UpdateOptions = {}): Promise<number> {
        return this.invoke(DataStoreEvent.Update, query, update, options);
    }

    protected find(query: any = {}, sort?: any): Promise<T[]> {
        return this.invoke(DataStoreEvent.Find, query, sort);
    }

    protected findOne(query: any = {}): Promise<T> {
        return this.invoke(DataStoreEvent.FindOne, query);
    }

    onChange(callback: (change: DataStoreChange) => void) {
        const channel = buildEventName(DataStoreEvent.Changed, this.name);
        const handler = (e: Electron.IpcRendererEvent, change: DataStoreChange): void => {
            callback(change);
        };

        // add listener
        ipcRenderer.on(channel, handler);

        // return a removal function
        return () => ipcRenderer.removeListener(channel, handler);
    }
}

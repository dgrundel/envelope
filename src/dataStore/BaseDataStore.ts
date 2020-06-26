import { Log } from '@/util/Logger';
import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import * as Nedb from 'nedb';
import * as path from 'path';

const dataStores: Record<string, DataStore<any, any>> = {};

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

interface IPCResult {
    success: boolean;
    data: any;
}

export interface UpdateResult<R> { 
    numUpdated: number;
    affectedDocuments: R|R[]
}

const getSerializableError = (err: Error) => Object.getOwnPropertyNames(err)
    .reduce((serializable: any, prop: string) => {
        serializable[prop] = (err as any)[prop]
        return serializable;
    }, {});

abstract class BaseDataStore<D, R extends D> {
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    protected buildEventName(event: DataStoreEvent, name: string) {
        return `${event}:${name}`;
    }
}

export class DataStore<D, R extends D> extends BaseDataStore<D, R> {
    private readonly db: Nedb<D>;

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

        this.handle(DataStoreEvent.Insert, (event, item: D) => {
            return this.insert(item);
        });
        this.handle(DataStoreEvent.InsertMany, (event, items: D[]) => {
            return this.insertMany(items);
        });
        this.handle(DataStoreEvent.Update, (event, query: any, update: any, options: Nedb.UpdateOptions) => {
            return this.update(query, update, options);
        });
        this.handle(DataStoreEvent.Find, (event, query?: any, sort?: any) => {
            return this.find(query, sort);
        });
        this.handle(DataStoreEvent.FindOne, (event, query?: any) => {
            return this.findOne(query);
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

    protected insert(item: D): Promise<R> {
        return new Promise((resolve, reject) => {
            this.db.insert(item, (err: Error, record: R) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Insert);
                    resolve(record);
                }
            });
        });
    }

    protected insertMany(items: D[]): Promise<R[]> {
        return new Promise((resolve, reject) => {
            this.db.insert(items, (err: Error, records: R[]) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Insert);
                    resolve(records);
                }
            });
        });
    }

    protected update(query: any, update: any, options: Nedb.UpdateOptions = {}): Promise<UpdateResult<R>> {
        return new Promise((resolve, reject) => {
            this.db.update(query, update, options, (err: Error, numUpdated: number, affectedDocuments: R|R[]) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreChange.Update);
                    resolve({
                        numUpdated,
                        affectedDocuments
                    });
                }
            });
        });
    }

    protected find(query: any = {}, sort?: any): Promise<R[]> {
        return new Promise((resolve, reject) => {
            let cursor = this.db.find(query);

            if (sort) {
                cursor = cursor.sort(sort);
            }

            cursor.exec((err: Error, records: R[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(records);
                }
            });
        });
    }

    protected findOne(query: any = {}): Promise<R> {
        return new Promise((resolve, reject) => {
            this.db.findOne(query, (err: Error, record: R) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(record);
                }
            });
        });
    }
}

export abstract class DataStoreClient<D, R extends D> extends BaseDataStore<D, R> {
    private invoke(event: DataStoreEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    protected abstract convertFields(item: R):R;

    protected insert(item: D): Promise<R> {
        return this.invoke(DataStoreEvent.Insert, item)
            .then((item: R) => this.convertFields(item));
    }

    protected insertMany(items: D[]): Promise<R[]> {
        return this.invoke(DataStoreEvent.InsertMany, items)
            .then((items: R[]) => items.map(item => this.convertFields(item)));
    }

    protected update(query: any, update: any, options: Nedb.UpdateOptions = {}): Promise<UpdateResult<R>> {
        return this.invoke(DataStoreEvent.Update, query, update, {
            ...options,
            returnUpdatedDocs: true
        })
        .then(result => {
            const affectedDocuments = Array.isArray(result.affectedDocuments)
                ? result.affectedDocuments.map((document: R) => this.convertFields(document))
                : this.convertFields(result.affectedDocuments);
            return {
                ...result,
                affectedDocuments
            };
        });
    }

    protected find(query: any = {}, sort?: any): Promise<R[]> {
        return this.invoke(DataStoreEvent.Find, query, sort)
            .then((items: R[]) => items.map(item => this.convertFields(item)));
    }

    protected findOne(query: any = {}): Promise<R | null> {
        return this.invoke(DataStoreEvent.FindOne, query)
            .then((item: R | null) => item ? this.convertFields(item) : null);
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

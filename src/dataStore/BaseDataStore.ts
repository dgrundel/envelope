import { app, ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import * as path from 'path';
import * as Nedb from 'nedb';

const dataStores: Record<string, DataStore<any>> = {};

export enum DataStoreEvent {
    Changed = 'datastore-changed',
    Insert = 'datastore-insert',
    Find = 'datastore-find'
}

export const buildEventName = (event: DataStoreEvent, name: string) => `${event}:${name}`;

export interface BaseDataStoreRecord {
    _id?: string;
};

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
        console.log(`Initializing '${name}' database at ${filePath}`);

        this.db = new Nedb({
            filename: filePath,
            autoload: true,
            corruptAlertThreshold: 0
        });

        ipcMain.handle(buildEventName(DataStoreEvent.Insert, this.name), async (event, item: T) => {
            return this.insert(item);
        });
        ipcMain.handle(buildEventName(DataStoreEvent.Find, this.name), async (event, query?: any) => {
            return this.find(query);
        });
    }

    protected triggerChanged(source: DataStoreEvent) {
        BrowserWindow.getAllWindows()
            .forEach(win => win.webContents.send(buildEventName(DataStoreEvent.Changed, this.name), source));
    }

    protected insert(item: T): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.insert(item, (err: Error, document: T) => {
                if (err) {
                    reject(err);
                } else {
                    this.triggerChanged(DataStoreEvent.Insert);
                    resolve(document);
                }
            });
        });
    }

    protected find(query: any = {}): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.find(query, (err: Error, documents: T[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(documents);
                }
            });
        });
    }
}

export class DataStoreClient<T extends BaseDataStoreRecord> extends BaseDataStore<T> {
    private invoke(event: DataStoreEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args);
    }

    protected insert(item: T): Promise<T> {
        return this.invoke(DataStoreEvent.Insert, item);
    }

    protected find(query: any = {}): Promise<T[]> {
        return this.invoke(DataStoreEvent.Find, query);
    }

    onChange(callback: (source: DataStoreEvent) => void) {
        ipcRenderer.on(buildEventName(DataStoreEvent.Changed, this.name), (e, eventSource: DataStoreEvent) => {
            callback(eventSource);
        });
    }
}

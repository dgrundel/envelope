import { app, ipcMain } from 'electron';
import * as path from 'path';
import * as Nedb from 'nedb';

const dataStores: Record<string, BaseDataStore<any>> = {};

export enum DataStoreEvent {
    Insert = 'datastore-insert',
    Find = 'datastore-find'
}

export const buildEventName = (event: DataStoreEvent, name: string) => `${event}:${name}`;

export interface BaseDataStoreRecord {
    _id?: string;
};

export class BaseDataStore<T extends BaseDataStoreRecord> {
    private readonly name: string;
    private readonly db: Nedb<T>;

    constructor(name: string) {
        if (dataStores.hasOwnProperty(name)) {
            throw new Error(`A data store already exists with the name: ${name}`);
        }

        this.name = name;
        this.db = new Nedb({
            filename: path.join(app.getPath('userData'), `${name}.db`),
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

    insert(item: T): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.insert(item, (err: Error, document: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(document);
                }
            });
        });
    }

    find(query: any = {}): Promise<T[]> {
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
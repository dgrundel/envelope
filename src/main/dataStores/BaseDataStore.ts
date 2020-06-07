import { app, Data } from 'electron';
import * as events from 'events';
import * as path from 'path';
import * as Nedb from 'nedb';

const dataStores: Record<string, BaseDataStore<any>> = {};

export interface BaseDataStoreRecord {
    _id?: string;
};

export class BaseDataStore<T extends BaseDataStoreRecord> {
    readonly name: string;
    readonly emitter: events.EventEmitter;
    readonly db: Nedb<T>;

    constructor(name: string) {
        if (dataStores.hasOwnProperty(name)) {
            throw new Error(`A data store already exists with the name: ${name}`);
        }

        this.name = name;
        this.emitter = new events.EventEmitter();
        this.db = new Nedb({
            filename: path.join(app.getPath('userData'), `${name}.db`),
            autoload: true,
            corruptAlertThreshold: 0
        });
    }

    insert(item: T) {
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

    find(query: any) {
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
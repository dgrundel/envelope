import { Log } from '@/util/Logger';
import { ipcMain, ipcRenderer } from 'electron';
import * as ElectronStore from 'electron-store';

const BASE_STORE_CONFIG = {};

export enum JsonStoreName {
    EnvelopeUserDate = 'envelope-user-data'
}

enum JsonStoreEvent {
    Get = 'json-store-get',
    Set = 'json-store-set',
    Remove = 'json-store-remove',
}

interface IPCResult {
    success: boolean;
    data: any;
}

const getSerializableError = (err: Error) => Object.getOwnPropertyNames(err)
    .reduce((serializable: any, prop: string) => {
        serializable[prop] = (err as any)[prop]
        return serializable;
    }, {});

abstract class BaseJsonStore {
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    protected eventNameFor(event: JsonStoreEvent) {
        return `${event}:${this.name}`;
    }

    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any): Promise<void>;
    abstract remove(key: string): Promise<void>;
}

export class JsonStoreHost extends BaseJsonStore {
    private readonly store: ElectronStore;

    constructor(name: string) {
        super(name);

        Log.info(`Initializing JSON store '${name}'`);

        this.store = new ElectronStore({
            ...BASE_STORE_CONFIG,
            name,
        });

        this.handle(JsonStoreEvent.Get, (_event, key: string) => this.get(key));
        this.handle(JsonStoreEvent.Set, (_event, key: string, value: any) => this.set(key, value));
        this.handle(JsonStoreEvent.Remove, (_event, key: string) => this.remove(key));
    }

    private handle(event: JsonStoreEvent, callback: (...args: any) => Promise<any>) {
        const channel = this.eventNameFor(event);
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

    get(key: string): Promise<any> {
        return new Promise(resolve => {
            resolve(this.store.get(key));
        });
    }

    set(key: string, value: any): Promise<void> {
        return new Promise(resolve => {
            this.store.set(key, value);
            resolve();
        });
    }

    remove(key: string): Promise<void> {
        return new Promise(resolve => {
            this.store.delete(key);
            resolve();
        });
    }
}

export class JsonStoreClient extends BaseJsonStore {
    private invoke(event: JsonStoreEvent, ...args: any) {
        return ipcRenderer.invoke(this.eventNameFor(event), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    get(key: string): Promise<any> {
        return this.invoke(JsonStoreEvent.Set, key);
    }

    set(key: string, value: any): Promise<void> {
        return this.invoke(JsonStoreEvent.Set, key, value);
    }

    remove(key: string): Promise<void> {
        return this.invoke(JsonStoreEvent.Remove, key);
    }
}


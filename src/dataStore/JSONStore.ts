import { Log } from '@/util/Logger';
import { ipcMain, ipcRenderer } from 'electron';
import * as ElectronStore from 'electron-store';
import { isProduction } from '@/util/Environment';

const BASE_STORE_CONFIG = {};

export enum JsonStoreName {
    EnvelopeUserData = 'envelope-user-data',
}

enum JsonStoreEvent {
    GetItem = 'json-store-get',
    SetItem = 'json-store-set',
    RemoveItem = 'json-store-remove',
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

    constructor(name: JsonStoreName) {
        this.name = this.getStoreName(name);
    }

    protected getStoreName(name: JsonStoreName) {
        return isProduction() ? name : `${name}.development`;
    }

    protected getEventName(event: JsonStoreEvent) {
        return `${event}:${this.name}`;
    }

    abstract getItem(key: string): Promise<any>;
    abstract setItem(key: string, value: any): Promise<void>;
    abstract removeItem(key: string): Promise<void>;
}

export class JsonStoreHost extends BaseJsonStore {
    private readonly store: ElectronStore;

    constructor(name: JsonStoreName) {
        super(name);

        Log.info(`Initializing JSON store '${this.name}'`);

        this.store = new ElectronStore({
            ...BASE_STORE_CONFIG,
            name: this.name,
        });

        this.handle(JsonStoreEvent.GetItem, (_event, key: string) => this.getItem(key));
        this.handle(JsonStoreEvent.SetItem, (_event, key: string, value: any) => this.setItem(key, value));
        this.handle(JsonStoreEvent.RemoveItem, (_event, key: string) => this.removeItem(key));
    }

    private handle(event: JsonStoreEvent, callback: (...args: any) => Promise<any>) {
        const channel = this.getEventName(event);
        ipcMain.handle(channel, (...args: any) => new Promise((resolve) => {
            callback(...args)
                .then(result => resolve({
                    success: true,
                    data: result
                }))
                .catch(reason => {
                    Log.error('Error in JsonStoreHost handler', reason);
                    resolve({
                        success: false,
                        data: getSerializableError(reason)
                    });
                });
        }));
    }

    getItem(key: string): Promise<any> {
        return new Promise(resolve => {
            const value = this.store.get(key);
            resolve(value);
        });
    }

    setItem(key: string, value: any): Promise<void> {
        return new Promise(resolve => {
            this.store.set(key, value);
            resolve();
        });
    }

    removeItem(key: string): Promise<void> {
        return new Promise(resolve => {
            this.store.delete(key);
            resolve();
        });
    }
}

export class JsonStoreClient extends BaseJsonStore {
    private invoke(event: JsonStoreEvent, ...args: any) {
        return ipcRenderer.invoke(this.getEventName(event), ...args)
            .then((result: IPCResult) => result.success ? Promise.resolve(result.data) : Promise.reject(result.data));
    }

    getItem(key: string): Promise<any> {
        return this.invoke(JsonStoreEvent.GetItem, key);
    }

    setItem(key: string, value: any): Promise<void> {
        return this.invoke(JsonStoreEvent.SetItem, key, value);
    }

    removeItem(key: string): Promise<void> {
        return this.invoke(JsonStoreEvent.RemoveItem, key);
    }
}


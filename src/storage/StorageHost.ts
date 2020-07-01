import { Log } from '@/util/Logger';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const ENCODING = 'utf8';

export interface StorageApi {
    get: (key: string) => Promise<string>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
}

export class StorageHost implements StorageApi {
    private readonly name: string;
    private readonly filePath: string;
    private data: any;
    
    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(app.getPath('userData'), `${name}.json`);
        this.data = this.load();
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
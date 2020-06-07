import { ipcRenderer } from "electron";
import { DataStoreEvent, buildEventName, BaseDataStoreRecord } from "./BaseDataStore";

export class BaseDataStoreClient<T extends BaseDataStoreRecord> {
    private readonly name: string;
    private readonly db: Nedb<T>;

    constructor(name: string) {
        this.name = name;
    }

    private invoke(event: DataStoreEvent, ...args: any) {
        return ipcRenderer.invoke(buildEventName(event, this.name), ...args);
    }

    insert(item: T): Promise<T> {
        return this.invoke(DataStoreEvent.Insert, item);
    }

    find(query: any = {}): Promise<T[]> {
        return this.invoke(DataStoreEvent.Find, query);
    }
}
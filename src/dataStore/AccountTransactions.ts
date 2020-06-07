import { BaseDataStoreRecord, BaseDataStore } from "./BaseDataStore";
import { DataStoreClient } from "./DataStoreClient";

const name = 'account-transactions';

export interface AccountTransaction extends BaseDataStoreRecord {
    date: number;
    description: string;
    amount: number;
    imported: Record<string, string>;
}

export class AccountTransactionDataStore extends BaseDataStore<AccountTransaction> {
    constructor() {
        super(name);
    }
}

export const getDataStoreClient = () => new DataStoreClient(name) as DataStoreClient<AccountTransaction>;

import { BaseDataStoreRecord, BaseDataStore } from "../BaseDataStore";
import { BaseDataStoreClient } from "../BaseDataStoreClient";

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

export class AccountTransactionDataStoreClient extends BaseDataStoreClient<AccountTransaction> {
    constructor() {
        super(name);
    }
}

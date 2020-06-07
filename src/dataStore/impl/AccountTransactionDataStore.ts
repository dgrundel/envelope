import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'account-transactions';

export interface AccountTransaction extends BaseDataStoreRecord {
    date: number;
    description: string;
    amount: number;
    imported: Record<string, string>;
}

export class AccountTransactionDataStore extends DataStore<AccountTransaction> {
    constructor() {
        super(name);
    }
}

export class AccountTransactionDataStoreClient extends DataStoreClient<AccountTransaction> {
    constructor() {
        super(name);
    }

    addTransaction(transaction: AccountTransaction) {
        return this.insert(transaction);
    }

    getTransactions(query: any = {}) {
        return this.find(query);
    }
}

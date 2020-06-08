import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'account-transactions';

export interface BankAccountTransaction extends BaseDataStoreRecord {
    bankAccountId: string;
    date: number;
    description: string;
    amount: number;
    imported: Record<string, string>;
}

export class BankAccountTransactionDataStore extends DataStore<BankAccountTransaction> {
    constructor() {
        super(name);
    }
}

export class BankAccountTransactionDataStoreClient extends DataStoreClient<BankAccountTransaction> {
    constructor() {
        super(name);
    }

    addTransaction(transaction: BankAccountTransaction) {
        return this.insert(transaction);
    }

    getTransactions(query: any = {}) {
        return this.find(query);
    }
}

import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'account-transactions';

export interface BankAccountTransaction extends BaseDataStoreRecord {
    bankAccountId: string;
    year: number;
    month: number;
    day: number;
    description: string;
    amount: number;
    originalRecord: Record<string, string>;
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

    addTransactions(transactions: BankAccountTransaction[]) {
        return this.insertMany(transactions);
    }

    getTransactions(query: any = {}) {
        return this.find(query);
    }
}

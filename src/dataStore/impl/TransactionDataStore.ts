import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'transactions';

export interface Transaction extends BaseDataStoreRecord {
    accountName: string;

    date: Date;
    year: number;
    month: number;
    description: string;
    wholeAmount: number; // signed, integer
    fractionalAmount: number; // unsigned, integer, in thousandths, range 0...999
    
    originalRecord?: Record<string, string>;
    envelopeName?: string;
}

export class TransactionDataStore extends DataStore<Transaction> {
    constructor() {
        super(name);
    }
}

export class TransactionDataStoreClient extends DataStoreClient<Transaction> {
    constructor() {
        super(name);
    }

    addTransaction(transaction: Transaction) {
        return this.insert(transaction);
    }

    addTransactions(transactions: Transaction[]) {
        return this.insertMany(transactions);
    }

    getTransactions(query: any = {}) {
        return this.find(query, { date: -1 });
    }
}

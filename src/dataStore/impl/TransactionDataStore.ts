import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";
import { Currency } from '@/util/Currency';

const name = 'transactions';

export const getTransactionAmount = (t: Transaction) => new Currency(t.wholeAmount, t.fractionalAmount);

export interface Transaction extends BaseDataStoreRecord {
    accountName: string;

    date: Date;
    year: number;
    month: number;
    description: string;
    wholeAmount: number; // signed, integer
    fractionalAmount: number; // signed, integer, in thousandths, range 0...999
    
    originalRecord?: Record<string, string>;

    linkedTransactions?: string[];
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

    getTransactionById(id: string) {
        return this.findOne({ _id: id });
    }

    getTransactionsById(ids: string[]) {
        return this.find({
            _id: { $in: ids }
        });
    }

    getImportedTransactions() {
        return this.getTransactions({
            originalRecord: { $exists: true }
        });
    }
}

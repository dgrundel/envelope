import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";
import { Currency } from '@/util/Currency';

const NAME = 'transactions';
const DEFAULT_SORT = { date: -1 };

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
        super(NAME);
    }
}

export class TransactionDataStoreClient extends DataStoreClient<Transaction> {
    constructor() {
        super(NAME);
    }

    addTransaction(transaction: Transaction) {
        return this.insert(transaction);
    }

    addTransactions(transactions: Transaction[]) {
        return this.insertMany(transactions);
    }

    getTransactions(query: any = {}) {
        return this.find(query, DEFAULT_SORT);
    }

    getTransactionById(id: string) {
        return this.findOne({ _id: id });
    }

    getTransactionsById(ids: string[]) {
        const query = {
            _id: { $in: ids }
        };
        return this.find(query, DEFAULT_SORT);
    }

    getImportedTransactions() {
        const query = {
            originalRecord: { $exists: true }
        };
        return this.getTransactions(query);
    }
}

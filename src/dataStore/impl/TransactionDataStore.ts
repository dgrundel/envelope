import { Currency } from '@/util/Currency';
import { DataStore, DataStoreClient } from "../BaseDataStore";

const NAME = 'transactions';
const DEFAULT_SORT = { date: -1 };

export const getTransactionAmount = (t: Transaction) => new Currency(t.wholeAmount, t.fractionalAmount);

export interface Transaction {
    _id?: string;
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

export class TransactionDataStore extends DataStore<Transaction, Transaction> {
    constructor() {
        super(NAME);
    }
}

export class TransactionDataStoreClient extends DataStoreClient<Transaction, Transaction> {
    constructor() {
        super(NAME);
    }

    addTransaction(transaction: Transaction) {
        return this.insert(transaction);
    }

    addLinkedTransaction(transaction: Transaction, linkTo: Transaction) {
        return this.insert(transaction)
            .then(created => {
                return this.update({
                    _id: linkTo._id
                }, { 
                    $addToSet: {
                        linkedTransactions: created._id as string
                    }
                })
                .then(() => this.getTransactionById(linkTo._id as string))
                .then(updated => [created, updated]);
            });
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

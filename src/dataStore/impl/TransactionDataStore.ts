import { Currency } from '@/util/Currency';
import { DataStore, DataStoreClient } from "../BaseDataStore";
import { TransactionData, Transaction } from '@/models/Transaction';

const NAME = 'transactions';
const DEFAULT_SORT = { date: -1 };

const convertFields = (transaction: Transaction) => ({
    ...transaction,
    amount: Currency.fromObject(transaction.amount)
});

export class TransactionDataStore extends DataStore<TransactionData, Transaction> {
    constructor() {
        super(NAME);
    }
}

export class TransactionDataStoreClient extends DataStoreClient<TransactionData, Transaction> {
    constructor() {
        super(NAME);
    }

    protected insert(item: TransactionData): Promise<Transaction> {
        return super.insert(item)
            .then(convertFields);
    }

    protected insertMany(items: TransactionData[]): Promise<Transaction[]> {
        return super.insertMany(items)
            .then(items => items.map(convertFields));
    }

    protected find(query: any = {}, sort?: any): Promise<Transaction[]> {
        return super.find(query, sort)
            .then(transactions => transactions.map(convertFields));
    }

    protected findOne(query: any = {}): Promise<Transaction> {
        return super.findOne(query)
            .then(convertFields);
    }

    addTransaction(transaction: TransactionData) {
        return this.insert(transaction);
    }

    addLinkedTransaction(transaction: TransactionData, linkTo: Transaction): Promise<[Transaction, Transaction]> {
        return this.insert(transaction)
            .then(created => {
                return this.update({
                    _id: linkTo._id
                }, { 
                    $addToSet: {
                        linkedTransactionIds: created._id
                    }
                })
                .then(() => this.getTransactionById(linkTo._id))
                .then(updated => [created, updated]);
            });
    }

    addTransactions(transactions: TransactionData[]) {
        return this.insertMany(transactions);
    }

    getAllTransactions() {
        return this.find({}, DEFAULT_SORT);
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

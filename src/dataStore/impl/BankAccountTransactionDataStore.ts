import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'account-transactions';

export interface BankAccountTransaction extends BaseDataStoreRecord {
    bankAccountName: string;
    date: Date;
    year: number;
    month: number;
    day: number;
    description: string;
    wholeAmount: number; // signed, integer
    fractionalAmount: number; // unsigned, integer, in thousandths, range 0...999
    originalRecord: Record<string, string>;
    envelopeName?: string;
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
        return this.find(query, { date: -1 });
    }
}

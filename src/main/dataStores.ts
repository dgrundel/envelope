import { AccountDataStore } from '@/dataStore/impl/AccountDataStore';
import { TransactionDataStore } from '@/dataStore/impl/TransactionDataStore';

class DataStoreManager {
    readonly accounts: AccountDataStore;
    readonly transactions: TransactionDataStore;

    constructor() {
        this.accounts = new AccountDataStore();
        this.transactions = new TransactionDataStore();
    }
}

export const dataStoreManager = new DataStoreManager();
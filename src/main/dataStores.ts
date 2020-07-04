import { TransactionDataStore } from '@/dataStore/impl/TransactionDataStore';

class DataStoreManager {
    readonly transactions: TransactionDataStore;

    constructor() {
        this.transactions = new TransactionDataStore();
    }
}

export const dataStoreManager = new DataStoreManager();
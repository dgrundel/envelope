import { BankAccountDataStore } from '@/dataStore/impl/BankAccountDataStore';
import { BankAccountTransactionDataStore } from '@/dataStore/impl/BankAccountTransactionDataStore';
import { EnvelopeDataStore } from '@/dataStore/impl/EnvelopeDataStore';

class DataStoreManager {
    readonly bankAccounts: BankAccountDataStore;
    readonly accountTransactions: BankAccountTransactionDataStore;
    readonly envelopes: EnvelopeDataStore;

    constructor() {
        this.bankAccounts = new BankAccountDataStore();
        this.accountTransactions = new BankAccountTransactionDataStore();
        this.envelopes = new EnvelopeDataStore();
    }
}

export const dataStoreManager = new DataStoreManager();
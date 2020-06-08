import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'bank-accounts';

export type BankAccountType = 'checking' | 'savings' | 'credit-card';

export interface BankAccount extends BaseDataStoreRecord {
    type: BankAccountType;
    name: string;
}

export class BankAccountDataStore extends DataStore<BankAccount> {
    constructor() {
        super(name);
    }
}

export class BankAccountDataStoreClient extends DataStoreClient<BankAccount> {
    constructor() {
        super(name);
    }

    addAccount(acct: BankAccount) {
        return this.insert(acct);
    }

    getAccounts(query: any = {}) {
        return this.find(query);
    }
}
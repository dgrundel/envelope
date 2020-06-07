import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'bank-accounts';

export type BankAccountType = 'bank' | 'credit-card';

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

    addAccount(type: BankAccountType, name: string) {
        return this.insert({
            type,
            name
        });
    }

    getAccounts(query: any = {}) {
        return this.find(query);
    }
}

import { BaseDataStoreRecord, BaseDataStore } from "../BaseDataStore";
import { BaseDataStoreClient } from "../BaseDataStoreClient";

const name = 'bank-accounts';

export type BankAccountType = 'bank' | 'credit-card';

export interface BankAccount extends BaseDataStoreRecord {
    type: BankAccountType;
    name: string;
}

export class BankAccountDataStore extends BaseDataStore<BankAccount> {
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

export class BankAccountDataStoreClient extends BaseDataStoreClient<BankAccount> {
    constructor() {
        super(name);
    }
}

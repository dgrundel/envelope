import { BaseDataStoreRecord, BaseDataStore } from "./BaseDataStore";

export type AccountType = 'bank' | 'credit-card';

export interface Account extends BaseDataStoreRecord {
    type: AccountType;
    name: string;
}

class AccountDataStore extends BaseDataStore<Account> {
    constructor() {
        super('accounts');
    }

    addAccount(type: AccountType, name: string) {
        return this.insert({
            type,
            name
        });
    }

    getAccounts(query: any = {}) {
        return this.find(query);
    }
}

export const accounts = new AccountDataStore();
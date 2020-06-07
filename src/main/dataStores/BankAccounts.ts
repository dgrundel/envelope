import { BaseDataStoreRecord, BaseDataStore } from "./BaseDataStore";

export type BankAccountType = 'bank' | 'credit-card';

export interface BankAccount extends BaseDataStoreRecord {
    type: BankAccountType;
    name: string;
}

class BankAccountDataStore extends BaseDataStore<BankAccount> {
    constructor() {
        super('accounts');
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

export const bankAccounts = new BankAccountDataStore();
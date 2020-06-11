import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'accounts';

export type AccountType = 'checking' | 'savings' | 'credit-card';

const accountTypeLabels = {
    'checking': 'Checking',
    'savings': 'Savings',
    'credit-card': 'Credit Card'
};

export const getAccountTypeLabel = (t: AccountType) => accountTypeLabels[t];

export interface Account extends BaseDataStoreRecord {
    type: AccountType;
    name: string;
}

export class AccountDataStore extends DataStore<Account> {
    constructor() {
        super(name);

        this.index({ fieldName: 'name', unique: true });
    }
}

export class AccountDataStoreClient extends DataStoreClient<Account> {
    constructor() {
        super(name);
    }

    addAccount(acct: Account) {
        return this.insert(acct);
    }

    getAccounts(query: any = {}) {
        return this.find(query);
    }
}

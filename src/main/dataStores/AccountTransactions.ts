import { BaseDataStoreRecord, BaseDataStore } from "./BaseDataStore";

export interface AccountTransaction extends BaseDataStoreRecord {
    date: number;
    description: string;
    amount: number;
    imported: Record<string, string>;
}

class AccountTransactionDataStore extends BaseDataStore<AccountTransaction> {
    constructor() {
        super('account-transactions');
    }
}

export const accountTransactions = new AccountTransactionDataStore();
import { Account, AccountData, AccountType, getBankAccountTypes } from '@/models/Account';
import { Currency } from '@/util/Currency';
import { DataStore, DataStoreClient } from "../BaseDataStore";

const NAME = 'accounts';
const DEFAULT_SORT = { name: 1 };

export class AccountDataStore extends DataStore<AccountData, Account> {
    constructor() {
        super(NAME);

        this.index({ fieldName: 'name', unique: true });
    }
}

export class AccountDataStoreClient extends DataStoreClient<AccountData, Account> {
    constructor() {
        super(NAME);
    }

    addAccount(acct: AccountData): Promise<Account[]> {
        return this.insert(acct)
            .then(created => {
                if (created.type === AccountType.CreditCard) {
                    return this.addAccount({
                        name: `${created.name} Payment`,
                        type: AccountType.PaymentEnvelope,
                        balance: Currency.ZERO,
                        linkedAccountIds: [created._id as string]
                    }).then(associated => Promise.resolve([created].concat(associated)));
                } else {
                    return Promise.resolve([created]);
                }
            });
    }

    updateAccountBalance(accountName: string, balance: Currency) {
        const query = { name: accountName };
        const update = {
            $set: {
                balance
            }
        };
        return this.update(query, update);
    }

    getAccount(name: string): Promise<Account> {
        const query = { name };
        return this.find(query)
            .then(accounts => Promise.resolve(accounts[0]));
    }

    getUserAccounts() {
        const query = { type: { $in: getBankAccountTypes() } };
        return this.find(query, DEFAULT_SORT);
    }

    getCreditCardEnvelopes() {
        const query = { type: AccountType.PaymentEnvelope };
        return this.find(query, DEFAULT_SORT);
    }

    getUserEnvelopes() {
        const query = { type: AccountType.UserEnvelope };
        return this.find(query, DEFAULT_SORT);
    }

    getAllAccounts() {
        const query = {};
        return this.find(query, DEFAULT_SORT);
    }
}

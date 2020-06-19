import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";
import { Currency } from '@/util/Currency';

const NAME = 'accounts';
const DEFAULT_SORT = { name: 1 };

export enum AccountType {
    Checking = 'checking' ,
    Savings = 'savings' ,
    CreditCard = 'credit-card',
    EnvelopePool = 'envelope-pool',
    EnvelopeCreditCard = 'envelope-credit-card',
    EnvelopeUser = 'envelope-user'
}

const accountTypeLabels = {
    'checking': 'Checking',
    'savings': 'Savings',
    'credit-card': 'Credit Card',

    // we'll probably never show these to users
    'envelope-pool': 'Pool Envelope',
    'envelope-credit-card': 'Credit Card Payment Envelope',
    'envelope-user': 'User-Defined Envelope'
};

export const getUserAccountTypes = () => [
    AccountType.Checking,
    AccountType.Savings,
    AccountType.CreditCard
];

export const getAccountTypeLabel = (t: AccountType) => accountTypeLabels[t];

export const getAccountBalance = (a: Account) => new Currency(a.balanceWholeAmount, a.balancefractionalAmount);

export interface Account extends BaseDataStoreRecord {
    type: AccountType;
    name: string;
    balanceWholeAmount: number; // signed, integer
    balancefractionalAmount: number; // signed, integer, in thousandths, range 0...999
    linkedAccounts?: string[];
}

export class AccountDataStore extends DataStore<Account> {
    constructor() {
        super(NAME);

        this.index({ fieldName: 'name', unique: true });
    }
}

export class AccountDataStoreClient extends DataStoreClient<Account> {
    constructor() {
        super(NAME);
    }

    addAccount(acct: Account): Promise<Account[]> {
        return this.insert(acct)
            .then(created => {
                if (created.type === AccountType.CreditCard) {
                    return this.addAccount({
                        name: `${created.name} Payment`,
                        type: AccountType.EnvelopeCreditCard,
                        balanceWholeAmount: 0,
                        balancefractionalAmount: 0,
                        linkedAccounts: [created._id as string]
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
                balanceWholeAmount: balance.wholeAmount,
                balancefractionalAmount: balance.fractionalAmount
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
        const query = { type: { $in: getUserAccountTypes() } };
        return this.find(query, DEFAULT_SORT);
    }

    getCreditCardEnvelopes() {
        const query = { type: AccountType.EnvelopeCreditCard };
        return this.find(query, DEFAULT_SORT);
    }

    getUserEnvelopes() {
        const query = { type: AccountType.EnvelopeUser };
        return this.find(query, DEFAULT_SORT);
    }
}

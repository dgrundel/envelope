import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'accounts';

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

export interface Account extends BaseDataStoreRecord {
    type: AccountType;
    name: string;
    balanceWholeAmount?: number; // signed, integer
    balancefractionalAmount?: number; // unsigned, integer, in thousandths, range 0...999
    linkedAccounts?: string[];
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

    addAccount(acct: Account): Promise<Account[]> {
        return this.insert(acct)
            .then(created => {
                if (created.type === AccountType.CreditCard) {
                    return this.addAccount({
                        name: `${created.name} Payment`,
                        type: AccountType.EnvelopeCreditCard,
                        linkedAccounts: [created._id as string]
                    }).then(associated => Promise.resolve([created].concat(associated)));
                } else {
                    return Promise.resolve([created]);
                }
            });
    }

    getUserAccounts() {
        const query = { type: { $in: getUserAccountTypes() } };
        return this.find(query);
    }

    getCreditCardEnvelopes() {
        const query = { type: AccountType.EnvelopeCreditCard };
        return this.find(query);
    }

    getUserEnvelopes() {
        const query = { type: AccountType.EnvelopeUser };
        return this.find(query);
    }
}

import { Account, AccountData, AccountType, getBankAccountTypes } from '@/models/Account';
import { Currency } from '@/util/Currency';
import { DataStore, DataStoreClient, UpdateResult } from "../BaseDataStore";
import { Log } from '@/util/Logger';

const NAME = 'accounts';
const DEFAULT_SORT = { name: 1 };

export class AccountDataStore extends DataStore<AccountData, Account> {
    constructor() {
        super(NAME);

        this.index({ fieldName: 'name', unique: true });
        this.index({ fieldName: 'type' });
    }
}

export class AccountDataStoreClient extends DataStoreClient<AccountData, Account> {
    constructor() {
        super(NAME);
    }

    protected convertFields(account: Account): Account {
        return {
            ...account,
            balance: Currency.fromObject(account.balance)
        };
    }

    addAccount(acct: AccountData): Promise<Account[]> {
        return this.insert(acct)
            .then(created => {
                if (created.type === AccountType.CreditCard) {
                    return this.addAccount({
                        name: `Payment for "${created.name}"`,
                        type: AccountType.PaymentEnvelope,
                        balance: Currency.ZERO,
                        linkedAccountIds: [created._id as string]
                    }).then(associated => Promise.resolve([created].concat(associated)));
                } else {
                    return Promise.resolve([created]);
                }
            });
    }

    updateAccountBalance(accountId: string, balance: Currency) {
        const query = { _id: accountId };
        const update = {
            $set: {
                balance
            }
        };
        const options = {
            multi: false,
            returnUpdatedDocs: true
        };
        return this.update(query, update, options)
            .then(result => result.affectedDocuments as Account);
    }

    // getAccount(name: string): Promise<Account> {
    //     const query = { name };
    //     return this.find(query)
    //         .then(accounts => Promise.resolve(accounts[0]));
    // }

    // getUserAccounts() {
    //     const query = { type: { $in: getBankAccountTypes() } };
    //     return this.find(query, DEFAULT_SORT);
    // }

    // getCreditCardEnvelopes() {
    //     const query = { type: AccountType.PaymentEnvelope };
    //     return this.find(query, DEFAULT_SORT);
    // }

    // getUserEnvelopes() {
    //     const query = { type: AccountType.UserEnvelope };
    //     return this.find(query, DEFAULT_SORT);
    // }

    getOrCreateUnallocatedAccount(): Promise<Account> {
        const query = {
            type: AccountType.Unallocated
        };
        return this.findOne(query)
            .then(result => {
                if (result) {
                    return result;
                }
                Log.debug('No unallocated account exists. Creating.');
                return this.addAccount({
                    // leading space is a performance hack to ensure we can always
                    // quickly locate the 'unallocate' account. (DB Account records 
                    // are sorted by name and JS `find` searches in order)
                    name: ' Ready to Budget',
                    type: AccountType.Unallocated,
                    balance: Currency.ZERO,
                    linkedAccountIds: []
                })
                .then(created => {
                    Log.debug('Created "unallocated" account', created);
                    return created[0];
                });
            });
    }

    getAllAccounts() {
        const query = {};
        return this.find(query, DEFAULT_SORT);
    }
}

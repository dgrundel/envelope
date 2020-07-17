import { createMigrate, PersistedState } from 'redux-persist';
import { AccountState, accounts } from '../reducers/Accounts';
import { Log } from '@/util/Logger';
import { filterOnlyAccountType } from '@/util/Filters';
import { Account, AccountType } from '@/models/Account';

type MigrateState = PersistedState & AccountState;

const NO_CHANGE = (state: MigrateState): MigrateState => state;

export const accountMigrations = createMigrate({
    0: NO_CHANGE,
    1: (state: MigrateState): MigrateState => {
        Log.debug('Migrating accounts. Cross-linking payment envelopes and credit card accounts.');

        const paymentEnvelopes = Object.values(state.accounts)
            .filter(filterOnlyAccountType(AccountType.PaymentEnvelope));
        const creditCardAccounts = paymentEnvelopes.reduce((map: Record<string, Account>, envelope: Account) => {
            envelope.linkedAccountIds.forEach(id => {
                const creditCardAccount = state.accounts[id];
                map[creditCardAccount._id] = {
                    ...creditCardAccount,
                    linkedAccountIds: [
                        ...creditCardAccount.linkedAccountIds,
                        envelope._id,
                    ]
                };
            });
            return map;
        }, {});

        Log.debug('creditCardAccounts', creditCardAccounts);

        return {
            ...state,
            accounts: {
                ...state.accounts,
                ...creditCardAccounts,
            }
        };
    },
});
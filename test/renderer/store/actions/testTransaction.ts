import * as Redux from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { addTransaction, TransactionAction } from '@/renderer/store/actions/Transaction';
import { Currency } from '@/util/Currency';
import { TransactionFlag, Transaction } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import createMockStore from 'redux-mock-store';
import { assert } from 'chai';
import { Account, AccountType } from '@/models/Account';
import { AccountAction } from '@/renderer/store/actions/Account';

type DispatchExts = ThunkDispatch<CombinedState, void, Redux.AnyAction>;

const middleware: Redux.Middleware[] = [thunk];
const mockStore = createMockStore<CombinedState, DispatchExts>(middleware);

describe('Transaction actions', function () {
    it('should correctly add transactions and apply them to the correct account', () => {
        const testAccount: Account = {
            _id: 'test-account-id',
            name: 'test',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        
        const store = mockStore({
            accounts: {
                accounts: {
                    [testAccount._id]: testAccount,
                },
                sortedIds: [testAccount._id],
                unallocatedId: testAccount._id
            },
            transactions: {
                transactions: {},
                sortedIds: [],
            }
        });

        const t: Transaction = {
            _id: 'test-trans-id',
            accountId: testAccount._id,
            date: new Date(),
            amount: new Currency(100, 0),
            description: 'test trans desc',
            flags: TransactionFlag.None,
            linkedTransactionIds: [],
        };
      
        store.dispatch(addTransaction(t));

        assert.deepEqual(store.getActions(), [
            {
                "linkTo": undefined,
                "transaction": t,
                "type": TransactionAction.Add,
            },
            {
                "accountId": testAccount._id,
                "balance": {
                    "fractionalAmount": 0,
                    "wholeAmount": 100,
                },
                "type": AccountAction.UpdateBalance,
            },
        ]);
      });
});
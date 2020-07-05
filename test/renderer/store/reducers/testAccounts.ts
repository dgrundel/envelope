import { assert } from 'chai';
import { accounts } from '@/renderer/store/reducers/Accounts';
import { Currency } from '@/util/Currency';
import { AccountType } from '@/models/Account';

describe('accounts reducer', function() {
    describe('initial state', function() {
        it('should provide usable initial state', function() {
            const actualInitialState = accounts(undefined, {});
            const unallocatedId = actualInitialState.unallocatedId;

            assert.equal(typeof unallocatedId, 'string');

            const expected = {
                "accounts": {
                    [unallocatedId]: {
                        "_id": unallocatedId,
                        "balance": Currency.ZERO,
                        "linkedAccountIds": [],
                        "name": "Ready to Budget",
                        "type": AccountType.Unallocated,
                    },
                },
                "sortedIds": [],
                "unallocatedId": unallocatedId,
            }
            
            assert.deepEqual(actualInitialState, expected);
        });
    });
});
  
import * as assert from 'assert';
import { combineFlags, containsFlag } from '@/util/Flags';
import { TransactionFlag } from '@/models/Transaction';

describe('Flags', function() {
    it('should combine flags as expected', function() {
        const flags = combineFlags(TransactionFlag.Adjustment, TransactionFlag.BankCredit);
        
        assert.equal(flags, 5);
    });

    it('should find flags in a combined set', function () {
        const combined = combineFlags(TransactionFlag.Adjustment, TransactionFlag.BankCredit);
        const exists = containsFlag(TransactionFlag.BankCredit, combined);
        assert.ok(exists);
    });

    it('should not find flags when not present', function () {
        const combined = combineFlags(TransactionFlag.Adjustment, TransactionFlag.BankCredit);
        const exists = containsFlag(combined, TransactionFlag.CreditAccountCredit);
        assert.ok(!exists);
    });
});
  
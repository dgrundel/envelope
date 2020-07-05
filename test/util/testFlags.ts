import { assert } from 'chai';
import { unionFlags, hasFlag, intersectFlags } from '@/util/Flags';
import { TransactionFlag } from '@/models/Transaction';

describe('Flags', function() {
    it('should combine flags as expected', function() {
        const flags = unionFlags(TransactionFlag.Adjustment, TransactionFlag.BankCredit);
        
        assert.equal(flags, 5);
    });

    it('should find flags in a combined set', function () {
        const combined = unionFlags(TransactionFlag.BankCredit, TransactionFlag.BankDebit, TransactionFlag.Adjustment, TransactionFlag.Transfer);
        const exists = hasFlag(TransactionFlag.BankCredit, combined);
        assert.ok(exists);
    });

    it('should not find flags when not present', function () {
        const combined = unionFlags(TransactionFlag.Adjustment, TransactionFlag.BankCredit);
        const exists = hasFlag(combined, TransactionFlag.CreditAccountCredit);
        assert.ok(!exists);
    });

    it('should correctly find the intersection of flags', function () {
        const set = unionFlags(
            TransactionFlag.BankCredit, 
            TransactionFlag.BankDebit,
            TransactionFlag.CreditAccountCredit, 
            TransactionFlag.CreditAccountDebit,
        );
        
        const intersect = intersectFlags(TransactionFlag.BankDebit, set);
        
        assert.equal(intersect, TransactionFlag.BankDebit);
    });
});
  
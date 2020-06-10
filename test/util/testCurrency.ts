import { Currency } from '@/util/Currency';
import * as assert from 'assert';

describe('Currency', function() {
    describe('parse()', function() {
        it('should correctly parse a simple string value', function() {
            const parsed = Currency.parse('12.34');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, 12);
            assert.equal(parsed.fractionalAmount, 340);
        });

        it('should fail to parse a non-numeric string value', function() {
            const parsed = Currency.parse('whatisthisidonteven');
            assert.equal(parsed.isValid(), false);
        });

        it('should correctly round fractional values > 3 digits', function() {
            const parsed = Currency.parse('12.3456789');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, 12);
            assert.equal(parsed.fractionalAmount, 346);
        });

        it('should correctly parse non-fractional values', function() {
            const parsed = Currency.parse('12');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, 12);
            assert.equal(parsed.fractionalAmount, 0);
        });

        it('should correctly parse negative values marked with "-" symbol', function() {
            const parsed = Currency.parse('-12');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, -12);
            assert.equal(parsed.fractionalAmount, 0);
        });

        it('should strip unimportant chars from start and end', function() {
            const parsed = Currency.parse('this is my $12.99 skateboard');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, 12);
            assert.equal(parsed.fractionalAmount, 990);
        });

        it('should correctly parse strings with currency symbols', function() {
            const parsed = Currency.parse('$12');
            assert.ok(parsed.isValid());
            assert.equal(parsed.wholeAmount, 12);
            assert.equal(parsed.fractionalAmount, 0);
        });
    });
});
  
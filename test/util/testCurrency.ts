import { assert } from 'chai';
import { Currency } from '@/util/Currency';

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

    describe('fromPrecisionInt()', function() {
        it('should correctly convert positive values', function() {
            const currency = Currency.fromPrecisionInt(12000);
            assert.equal(currency.wholeAmount, 12);
            assert.equal(currency.fractionalAmount, 0);
        });

        it('should correctly convert negative values', function() {
            const currency = Currency.fromPrecisionInt(-12000);
            assert.equal(currency.wholeAmount, -12);
            assert.equal(currency.fractionalAmount, 0);
        });

        it('should correctly convert small values', function() {
            const currency = Currency.fromPrecisionInt(-1);
            assert.equal(currency.wholeAmount, 0);
            assert.equal(currency.fractionalAmount, -1);
        });
    });

    describe('toPrecisionInt()', function() {
        it('should correctly convert positive values', function() {
            const currency = new Currency(3, 500);
            assert.equal(currency.toPrecisionInt(), 3500);
        });

        it('should correctly convert negative values w/ negative whole', function() {
            const currency = new Currency(-3, 500);
            assert.equal(currency.toPrecisionInt(), -3500);
        });

        it('should correctly convert negative values w/ negative frac', function() {
            const currency = new Currency(3, -500);
            assert.equal(currency.toPrecisionInt(), -3500);
        });

        it('should correctly convert negative values w/ both negative', function() {
            const currency = new Currency(-3, -500);
            assert.equal(currency.toPrecisionInt(), -3500);
        });

        it('should correctly convert small values', function() {
            const currency = new Currency(0, 50);
            assert.equal(currency.toPrecisionInt(), 50);
        });
    });

    describe('isNegative()', function() {
        it('should return true for negative whole', function() {
            const currency = new Currency(-3, 500);
            assert.equal(currency.isNegative(), true);
        });

        it('should return true for negative fraction', function() {
            const currency = new Currency(3, -500);
            assert.equal(currency.isNegative(), true);
        });

        it('should return true for negative whole and fraction', function() {
            const currency = new Currency(-3, -500);
            assert.equal(currency.isNegative(), true);
        });

        it('should return false for positive whole and fraction', function() {
            const currency = new Currency(3, 500);
            assert.equal(currency.isNegative(), false);
        });
    });

    describe('add()', function () {
        it('should correctly add two positives', function () {
            const a = new Currency(3, 500);
            const b = new Currency(1, 250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 4);
            assert.equal(sum.fractionalAmount, 750);
        });

        it('should correctly add two small positives', function () {
            const a = new Currency(0, 100);
            const b = new Currency(0, 150);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 0);
            assert.equal(sum.fractionalAmount, 250);
        });

        it('should correctly add two negatives', function () {
            const a = new Currency(-3, -500);
            const b = new Currency(-1, -250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, -4);
            assert.equal(sum.fractionalAmount, -750);
        });

        it('should correctly add two small negatives', function () {
            const a = new Currency(0, -500);
            const b = new Currency(0, -250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 0);
            assert.equal(sum.fractionalAmount, -750);
        });

        it('should correctly add one pos, one negative', function () {
            const a = new Currency(3, 500);
            const b = new Currency(-1, -250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 2);
            assert.equal(sum.fractionalAmount, 250);
        });

        it('should correctly add one small pos, one small negative', function () {
            const a = new Currency(0, 500);
            const b = new Currency(0, -250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 0);
            assert.equal(sum.fractionalAmount, 250);
        });

        it('should correctly add one pos, one small negative', function () {
            const a = new Currency(1, 500);
            const b = new Currency(0, -250);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 1);
            assert.equal(sum.fractionalAmount, 250);
        });

        it('should correctly add one pos, one negative with negative result', function () {
            const a = new Currency(1, 500);
            const b = new Currency(-2, -750);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, -1);
            assert.equal(sum.fractionalAmount, -250);
        });

        it('should correctly add one small pos, one small negative with negative result', function () {
            const a = new Currency(0, 500);
            const b = new Currency(0, -750);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 0);
            assert.equal(sum.fractionalAmount, -250);
        });

        it('should correctly roll fractional into whole', function () {
            const a = new Currency(2, 750);
            const b = new Currency(3, 750);
            const sum = a.add(b);
            assert.equal(sum.wholeAmount, 6);
            assert.equal(sum.fractionalAmount, 500);
        });
    });

    describe('toFormattedString()', function() {
        it('should pad cents < 10 (100 thou)', function() {
            // cents are represented in thousands, so 30 == 3c.
            const formatted = new Currency(12, 30).toFormattedString();
            
            assert.equal(formatted, '$12.03');
        });

        it('should not pad cents > 10 (100 thou)', function() {
            // cents are represented in thousands, so 900 == 90c.
            const formatted = new Currency(12, 900).toFormattedString();
            
            assert.equal(formatted, '$12.90');
        });

        it('should put the negative sign "-" before the currency symbol', function() {
            // cents are represented in thousands, so 900 == 90c.
            const formatted = new Currency(-12, 900).toFormattedString();
            
            assert.equal(formatted, '-$12.90');
        });

        it('should insert a , to separate thousands', function() {
            // cents are represented in thousands, so 900 == 90c.
            const formatted = new Currency(1200000, 0).toFormattedString();
            
            assert.equal(formatted, '$1,200,000.00');
        });

        it('should NOT insert a leading thousands separator', function() {
            const tests: Record<string, number> = {
                '$100.00': 100,
                '$100,000.00': 100000,
                '$100,000,000.00': 100000000,
            };

            Object.keys(tests).forEach(expected => {
                const whole = tests[expected];
                const formatted = new Currency(whole, 0).toFormattedString();
                assert.equal(formatted, expected);
            });
        });
    });
});
  
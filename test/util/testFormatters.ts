import { Currency } from '@/util/Currency';
import * as assert from 'assert';
import { leftPad, currencyFormatter } from '@/util/Formatters';

describe('Formatters', function() {
    describe('leftPad()', function() {
        it('should not pad a string that is already too long', function() {
            const padded = leftPad('hello', 3, '#');
            
            assert.equal(padded, 'hello');
        });

        it('should correctly pad a string that needs it', function() {
            const padded = leftPad('hi', 7, '#');
            
            assert.equal(padded, '#####hi');
        });

        it('should pad a string without exceeding desired length', function() {
            const padded = leftPad('hi', 7, 'bye');
            
            assert.equal(padded, 'byehi');
        });
    });

    describe('currencyFormatter()', function() {
        it('should pad cents < 10 (100 thou)', function() {
            // cents are represented in thousands, so 30 == 3c.
            const formatted = currencyFormatter(12, 30);
            
            assert.equal(formatted, '$12.03');
        });

        it('should not pad cents > 10 (100 thou)', function() {
            // cents are represented in thousands, so 900 == 90c.
            const formatted = currencyFormatter(12, 900);
            
            assert.equal(formatted, '$12.90');
        });

        it('should put the negative sign "-" before the currency symbol', function() {
            // cents are represented in thousands, so 900 == 90c.
            const formatted = currencyFormatter(-12, 900);
            
            assert.equal(formatted, '-$12.90');
        });
    });
});
  
import { assert } from 'chai';
import { leftPad } from '@/util/Formatters';

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
});
  
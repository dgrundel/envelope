import { leftPad } from './Formatters';

const DECIMAL_SEPARATOR = '.';
const PRECISION = 1000; // thousandths
const CENTS_PRECISION = 100;

export class Currency {
    wholeAmount: number; // signed, integer
    fractionalAmount: number; // signed, integer, range 0...{precision - 1}

    constructor(wholeAmount: number, fractionalAmount: number) {
        this.wholeAmount = wholeAmount;
        this.fractionalAmount = fractionalAmount;
    }

    isValid() {
        return !(isNaN(this.wholeAmount) || isNaN(this.fractionalAmount));
    }

    isNegative() {
        return this.wholeAmount < 0 || this.fractionalAmount < 0;
    }

    add(other: Currency) {
        const sum = this.toPrecisionInt() + other.toPrecisionInt();
        return Currency.fromPrecisionInt(sum);
    }

    sub(other: Currency) {
        const oNeg = new Currency(other.wholeAmount * -1, other.fractionalAmount);
        return this.add(oNeg);
    }

    toPrecisionInt() {
        return (this.isNegative() ? -1 : 1) * (Math.abs(this.wholeAmount * PRECISION) + Math.abs(this.fractionalAmount));
    }

    toFormattedString() {
        const centsDivisor = PRECISION / CENTS_PRECISION;
        const cents = Math.round(Math.abs(this.fractionalAmount) / centsDivisor).toFixed(0);
        const formattedCents = leftPad(cents, 2, '0');
        const formattedWhole = Math.abs(this.wholeAmount);
        const sign = this.isNegative() ? '-' : '';

        return `${sign}$${formattedWhole}${DECIMAL_SEPARATOR}${formattedCents}`;
    }

    toString() {
        return `${this.wholeAmount}.${this.fractionalAmount}`;
    }

    static fromPrecisionInt(n: number): Currency {
        const sign = n < 0 ? -1 : 1;
        const whole = Math.floor(Math.abs(n / PRECISION)) * sign;
        const frac = n % PRECISION;
        
        return new Currency(whole, frac);
    }

    static parse(s: string): Currency {
        const stripped = s
            // strip non-numeric, non-dash chars from end of string
            .replace(/[^0-9-]+$/, '')
            // strip non-numeric, non-dash chars from beginning of string
            .replace(/^[^0-9-]+/, '');

        const amount = parseFloat(stripped);
        const precisionInt = Math.round(amount * PRECISION);
        
        return Currency.fromPrecisionInt(precisionInt);
    }
}
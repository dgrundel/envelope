import { currencyFormatter } from './Formatters';

const precision = 1000; // thousandths

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
        return (this.isNegative() ? -1 : 1) * (Math.abs(this.wholeAmount * precision) + Math.abs(this.fractionalAmount));
    }

    toString() {
        return `${this.wholeAmount}.${this.fractionalAmount}`;
    }

    static fromPrecisionInt(n: number): Currency {
        const sign = n < 0 ? -1 : 1;
        const whole = Math.floor(Math.abs(n / precision)) * sign;
        const frac = n % precision;
        
        return new Currency(whole, frac);
    }

    static parse(s: string): Currency {
        const stripped = s
            // strip non-numeric, non-dash chars from end of string
            .replace(/[^0-9-]+$/, '')
            // strip non-numeric, non-dash chars from beginning of string
            .replace(/^[^0-9-]+/, '');

        const amount = parseFloat(stripped);
        const precisionInt = Math.round(amount * precision);
        
        return Currency.fromPrecisionInt(precisionInt);
    }
}
import { leftPad } from './Formatters';

const PRECISION_DIGITS = 3; // thousandths
const PRECISION = Math.pow(10, PRECISION_DIGITS);
const CENTS_PRECISION = 100;

const NEGATIVE_SYMBOL = '-';
const THOUSANDS_SEPARATOR = ',';
const DECIMAL_SEPARATOR = '.';

export class Currency {
    static ZERO = Currency.fromPrecisionInt(0);

    readonly wholeAmount: number; // signed, integer
    readonly fractionalAmount: number; // signed, integer, range 0...{precision - 1}

    constructor(wholeAmount: number, fractionalAmount: number) {
        this.wholeAmount = wholeAmount;
        this.fractionalAmount = fractionalAmount;
    }

    isValid() {
        return !(isNaN(this.wholeAmount) || isNaN(this.fractionalAmount));
    }

    isZero() {
        return this.toPrecisionInt() === 0;
    }

    isNegative() {
        return this.wholeAmount < 0 || this.fractionalAmount < 0;
    }

    isPositive() {
        return !this.isNegative();
    }

    or(other: Currency) {
        return this.isValid() ? this : other;
    }

    add(other: Currency) {
        const sum = this.toPrecisionInt() + other.toPrecisionInt();
        return Currency.fromPrecisionInt(sum);
    }

    sub(other: Currency) {
        const diff = this.toPrecisionInt() - other.toPrecisionInt();
        return Currency.fromPrecisionInt(diff);
    }

    gt(other: Currency) {
        return this.toPrecisionInt() > other.toPrecisionInt();
    }

    gte(other: Currency) {
        return this.toPrecisionInt() >= other.toPrecisionInt();
    }

    lt(other: Currency) {
        return this.toPrecisionInt() < other.toPrecisionInt();
    }

    lte(other: Currency) {
        return this.toPrecisionInt() <= other.toPrecisionInt();
    }

    eq(other: Currency) {
        return this.toPrecisionInt() === other.toPrecisionInt();
    }

    clone() {
        return Currency.fromPrecisionInt(this.toPrecisionInt());
    }

    getInverse() {
        return Currency.fromPrecisionInt(this.toPrecisionInt() * -1);
    }

    getAbsolute() {
        return this.isNegative() ? this.getInverse() : this.clone();
    }

    toPrecisionInt() {
        return (this.isNegative() ? -1 : 1) * (Math.abs(this.wholeAmount * PRECISION) + Math.abs(this.fractionalAmount));
    }

    toFormattedString() {
        const sign = this.isNegative() ? NEGATIVE_SYMBOL : '';

        const whole = Math.abs(this.wholeAmount).toFixed(0).split('');

        for (let i = whole.length % 3 || 3; i < whole.length; i += 4) {
            whole.splice(i, 0, THOUSANDS_SEPARATOR);
        }
        const formattedWhole = whole.join('');

        const centsDivisor = PRECISION / CENTS_PRECISION;
        const cents = Math.round(Math.abs(this.fractionalAmount) / centsDivisor).toFixed(0);
        const formattedCents = leftPad(cents, 2, '0');        

        return `${sign}$${formattedWhole}${DECIMAL_SEPARATOR}${formattedCents}`;
    }

    toString() {
        const fracStr = Math.abs(this.fractionalAmount).toFixed(0);
        const formattedFrac = leftPad(fracStr, PRECISION_DIGITS, '0');        
        return `${this.wholeAmount}.${formattedFrac}`;
    }

    static fromPrecisionInt(n: number): Currency {
        const sign = n < 0 ? -1 : 1;
        const whole = Math.floor(Math.abs(n / PRECISION)) * sign;
        const frac = n % PRECISION;
        
        return new Currency(whole, frac);
    }

    static fromObject(o: any) {
        return new Currency(o.wholeAmount, o.fractionalAmount);
    }

    static parse(s: string): Currency {
        const stripped = (s || '')
            // strip non-numeric, non-dash chars from end of string
            .replace(/[^0-9-]+$/, '')
            // strip non-numeric, non-dash chars from beginning of string
            .replace(/^[^0-9-]+/, '');

        const amount = parseFloat(stripped);
        const precisionInt = Math.round(amount * PRECISION);
        return Currency.fromPrecisionInt(precisionInt);
    }
}
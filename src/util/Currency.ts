
export class Currency {
    wholeAmount: number; // signed, integer
    fractionalAmount: number; // unsigned, integer, in thousandths, range 0...999

    constructor(wholeAmount: number, fractionalAmount: number) {
        this.wholeAmount = wholeAmount;
        this.fractionalAmount = fractionalAmount;
    }

    isValid() {
        return !(isNaN(this.wholeAmount) || isNaN(this.fractionalAmount));
    }

    static parse(s: string): Currency {
        const stripped = s
            // strip non-numeric, non-dash chars from end of string
            .replace(/[^0-9-]+$/, '')
            // strip non-numeric, non-dash chars from beginning of string
            .replace(/^[^0-9-]+/, '');

        const amount = parseFloat(stripped);
        const wholeAmount = Math.floor(amount);
        const fractionalAmount = Math.round((amount * 1000) - (wholeAmount * 1000));
        
        return new Currency(wholeAmount, fractionalAmount);
    }
}
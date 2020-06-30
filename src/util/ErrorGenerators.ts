import { isValidCurrencyString } from './Filters';
import { Currency } from './Currency';

export type ErrorGenerator = (value?: string) => string;
export type ErrorGeneratorFactory = (...args: any[]) => ErrorGenerator;

/*
 * Error generators
 * 
 * Used directly in form fields to generate error messages, or used
 * in chained combinations. 
 */

export const getRequiredCurrencyError: ErrorGenerator = (value?: string): string => isValidCurrencyString(value) ? '' : 'Hmm, that doesn\'t look like a number.';

export const chainErrorGenerators: ErrorGeneratorFactory = (...generators: ErrorGenerator[]): ErrorGenerator => (value?: string) => {
    for (let i = 0; i < generators.length; i++) {
        const generator = generators[i];
        const err = generator(value);
        if (err) {
            return err;
        }
    }
    return '';
};

export const minCurrencyErrorGenerator: ErrorGeneratorFactory = (min: Currency, eqOk?: boolean) => chainErrorGenerators(
    getRequiredCurrencyError,
    (value?: string) => {
        const currency = Currency.parse(value!);
        const valid = eqOk === true ? currency.gte(min) : currency.gt(min);
        return valid ? '' : `Value must be greater than ${eqOk ? 'or equal to ' : ''}${min.toFormattedString()}`;
    }
);

export const maxCurrencyErrorGenerator: ErrorGeneratorFactory = (max: Currency, eqOk?: boolean) => chainErrorGenerators(
    getRequiredCurrencyError,
    (value?: string) => {
        const currency = Currency.parse(value!);
        const valid = eqOk === true ? currency.lte(max) : currency.lt(max);
        return valid ? '' : `Value must be less than ${eqOk ? 'or equal to ' : ''}${max.toFormattedString()}`;
    }
);
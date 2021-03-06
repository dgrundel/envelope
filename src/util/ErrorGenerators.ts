import { isValidCurrencyString, isBlank, isNotBlank, filterOnlyAccountTypeIn } from './Filters';
import { Currency } from '../models/Currency';
import { AccountType } from '@/models/Account';

export type ErrorGenerator = (value?: string) => string;
export type ErrorGeneratorFactory = (...args: any[]) => ErrorGenerator;

/*
 * Error generators
 * 
 * Used directly in form fields to generate error messages, or used
 * in chained combinations. 
 */

export const getRequiredCurrencyError: ErrorGenerator = (value?: string): string => isValidCurrencyString(value) ? '' : 'Hmm, that doesn\'t look like a number.';

/*
 * Error generator factories
 *
 * Used to build error generators
 */

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

export const requiredStringErrorGenerator: ErrorGeneratorFactory = (errorMessage: string) => (value?: string) => {
    const blank = isBlank(value);
    return blank ? errorMessage : '';
};

export const uniqueStringErrorGenerator: ErrorGeneratorFactory = (existingValues: string[], errorMessage: string, caseSensitive: boolean = false) => {
    const existing = caseSensitive
        ? existingValues
        : existingValues.map(v => v.toLowerCase());

    return (value?: string) => {
        const exists = isNotBlank(value) && existing.includes(caseSensitive ? value : value.toLowerCase());
        return exists ? errorMessage : '';
    };
};

export const requiredAccountTypeErrorGenerator: ErrorGeneratorFactory = (allowedTypes: AccountType[], errorMessage?: string) => (value?: string) => {
    const valid = value && allowedTypes.includes(value as AccountType);
    return valid ? '' : (errorMessage || 'Please select an account type.');
};
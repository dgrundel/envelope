import { getUserAccountTypes } from '@/dataStore/impl/AccountDataStore';
import { Currency } from '@/util/Currency';

export type FieldValue = string | string[] | undefined;
export type ValidationResult = string | boolean;
export type FieldValidator = (value?: FieldValue) => ValidationResult;
export type FieldValueMap = Record<string, FieldValue>;
export type FieldErrorMap = Record<string, string>;
export type ChangeHandler = (fieldName: string, fieldValue: FieldValue) => void;

export interface ValidatedField {
    name: string;
    value?: FieldValue;
    validator: FieldValidator;
}

interface FieldRecord extends ValidatedField {
    value?: FieldValue;
    valid: boolean;
    error?: string;
}

type FieldMap = Record<string, FieldRecord>;

export class CommonValidators {
    static chain(...validators: FieldValidator[]): FieldValidator {
        return (value?: FieldValue) => {
            // run each validator until one returns an invalid result
            for (let i = 0; i < validators.length; i++) {
                const result = validators[i](value);
                if (result !== true) {
                    return result;
                }
            }
            // all passed, return true
            return true;
        };
    }

    static required(): FieldValidator {
        return (value?: FieldValue) => typeof value === 'string' && value.trim().length > 0 ? true : `This field is required.`;
    }

    static accountType(): FieldValidator {
        return (value?: FieldValue) => typeof value === 'string' && getUserAccountTypes().findIndex(t => t === value) !== -1 ? true : `Please select an account type.`;
    }
    
    static currency(): FieldValidator {
        return (value?: FieldValue) => {
            if (typeof value === 'string') {
                if (value.trim().length === 0 || Currency.parse(value).isValid()) {
                    return true;
                }
            } else if (typeof value === 'undefined') {
                return true;
            }
            return `Hmm, this doesn't look like a number.`
        };
    }
    
};

export class FormValidator {
    private readonly touched: Record<string, boolean>;
    private readonly fields: FieldMap;
    private readonly changeHandler?: ChangeHandler;

    constructor(fields: ValidatedField[], changeHandler?: ChangeHandler) {
        this.touched = {};
        this.fields = fields.reduce((fields: FieldMap, field: ValidatedField) => {
            fields[field.name] = this.validateField({
                ...field,
                valid: false
            });
            return fields;
        }, {});
        this.changeHandler = changeHandler;
    }

    setValue(fieldName: string, fieldValue: FieldValue) {
        const field = this.fields[fieldName];
        if (field) {
            field.value = fieldValue;
            this.validateField(field, true);

            if (this.changeHandler) {
                this.changeHandler(fieldName, fieldValue);
            }
        }
    }

    allValid(touch: boolean = true): boolean {
        return Object.keys(this.fields)
            .reduce((allValid: boolean, fieldName: string) => {
                const field = this.fields[fieldName];
                this.validateField(field, touch);
                return allValid && field.valid;
            }, true);
    }

    values(): FieldValueMap {
        return Object.keys(this.fields)
            .reduce((map: FieldValueMap, fieldName: string) => {
                map[fieldName] = this.fields[fieldName].value;
                return map;
            }, {});
    }

    errors(): FieldErrorMap {
        return Object.keys(this.fields)
            .reduce((map: FieldErrorMap, fieldName: string) => {
                const error = this.fields[fieldName].error;
                if (error) {
                    map[fieldName] = error;
                }
                return map;
            }, {});
    }

    private validateField(field: FieldRecord, touch: boolean = false): FieldRecord {
        if (touch) {
            this.touched[field.name] = true;
        }
        const touched = this.touched[field.name] === true;
        const result = field.validator(field.value);
        field.valid = result === true;
        // only _show_ the errors if the field has been touched
        if (touched && typeof result === 'string') {
            field.error = result;
        } else {
            field.error = undefined;
        }
        return field; // for ease of use
    }
}
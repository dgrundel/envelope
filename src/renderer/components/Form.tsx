import { remote } from 'electron';
import * as React from "react";
import { Box } from "./Box";
import { BankAccount, BankAccountType, BankAccountDataStoreClient } from '@/dataStore/impl/BankAccountDataStore';

import '@public/components/Form.scss';

export interface FormFieldError {
    message: string;
}

export type FormFieldType = 'text' | 'select';
export type FormFieldValues = Record<string, any>;
export type ValidationResult = Record<string, FormFieldError>;
export type FormValidator = (values: FormFieldValues) => ValidationResult;

export interface FormFieldOption {
    label: string;
    value: any;
}

export interface FormField {
    name: string;
    label: string;
    type: FormFieldType;
    options?: FormFieldOption[];
    placeholder?: string;
    value?: any;
    required?: boolean;
    helpText?: string;
}

export interface FormProps {
    fields: FormField[];
    onSubmit: (values: FormFieldValues) => void;
    validator?: FormValidator;
    submitLabel?: string;
}

export interface FormState {
    values: FormFieldValues;
    validationResult: ValidationResult;
}

export class Form extends React.Component<FormProps, FormState> {

    constructor(props: FormProps) {
        super(props);

        this.state = {
            values: props.fields.reduce((map: Record<string, any>, field: FormField) => {
                const name = field.name;

                let value = undefined;
                if (typeof field.value !== 'undefined') {
                    value = field.value;
                } else if (field.type === 'select' && field.options && field.options.length) {
                    value = field.options[0].value
                }

                map[name] = value;
                return map;
            }, {}),
            validationResult: {}
        };

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
        return <form className="form-component" onSubmit={this.onSubmit}>
            {this.props.fields.map(field => {
                const name = field.name;
                const value = this.state.values[name];
                const options = field.options || [];

                switch(field.type) {
                    case 'select':
                        return <label key={name} className={this.fieldClassName(name)}>
                            <span className="form-component-input-label">
                                {field.label}
                            </span>
                            <select 
                                name={name}
                                onChange={this.onChange}
                                value={value}
                            >
                                {options.map(fieldOption => <option 
                                    key={fieldOption.value}
                                    value={fieldOption.value}
                                >
                                    {fieldOption.label}
                                </option>)}
                            </select>
                            <small className="form-component-input-help">{field.helpText}</small>
                            <p className="form-component-input-error">{this.fieldErrorMessage(name)}</p>
                        </label>;
                    case 'text':
                    default:
                        return <label key={name} className={this.fieldClassName(name)}>
                            <span className="form-component-input-label">
                                {field.label}
                            </span>
                            <input
                                name={name}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={value || ''}
                                required={field.required}
                                onChange={this.onChange}
                            />
                            <small className="form-component-input-help">{field.helpText}</small>
                        </label>;
                }
            })}
            <div className="form-footer">
                <button className="btn" type="submit">
                    {this.props.submitLabel || 'Submit'}
                </button>
            </div>
        </form>;
    }

    fieldClassName(fieldName: string) {
        const isInvalidField = this.state.validationResult.hasOwnProperty(fieldName);
        return isInvalidField ? 'form-invalid-field' : '';
    }

    fieldErrorMessage(fieldName: string) {
        const error = this.state.validationResult[fieldName];
        if (error) {
            return error.message;
        }
    }

    onChange(e: React.FormEvent<HTMLElement>) {
        const target = e.target;
        const name = (target as HTMLElement).getAttribute('name');
        
        if (name) {
            this.setState(prev => {
                prev.values[name] = (target as HTMLInputElement).value;
                return {
                    values: prev.values
                };
            });
        }
    }

    onSubmit(e: React.FormEvent) {
        e.preventDefault();

        let validationResult: ValidationResult = {};
        if (this.props.validator) {
            validationResult = this.props.validator(this.state.values);
        }

        this.setState({
            validationResult
        });

        if (Object.keys(validationResult).length === 0) {
            this.props.onSubmit(this.state.values);
        }
    }
}
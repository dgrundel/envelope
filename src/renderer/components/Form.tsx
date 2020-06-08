import { remote } from 'electron';
import * as React from "react";
import { Box } from "./Box";
import { BankAccount, BankAccountType, BankAccountDataStoreClient } from '@/dataStore/impl/BankAccountDataStore';

import '@public/components/Form.scss';

export type FormFieldType = 'text' | 'select';
export type FormFieldValues = Record<string, any>;

export interface FormFieldOption {
    label: string;
    value: any;
}

export interface FormField {
    label: string;
    type: FormFieldType;
    options?: FormFieldOption[];
    placeholder?: string;
    value?: any;
    required?: boolean;
}

export interface FormProps {
    fields: Record<string, FormField>;
    onSubmit: (values: FormFieldValues) => void;
    submitLabel?: string;
}

export interface FormState {
    values: FormFieldValues;
}

export class Form extends React.Component<FormProps, FormState> {

    constructor(props: FormProps) {
        super(props);

        this.state = {
            values: Object.keys(props.fields).reduce((map: Record<string, any>, name: string) => {
                const field = props.fields[name];

                let value = undefined;
                if (typeof field.value !== 'undefined') {
                    value = field.value;
                } else if (field.type === 'select' && field.options && field.options.length) {
                    value = field.options[0].value
                }

                map[name] = value;
                return map;
            }, {})
        };

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    render() {
        return <form className="form-component" onSubmit={this.onSubmit}>
            {Object.keys(this.props.fields).map(name => {
                const field = this.props.fields[name];
                const value = this.state.values[name];
                const options = field.options || [];

                switch(field.type) {
                    case 'select':
                        return <label key={name}>
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
                        </label>;
                    case 'text':
                    default:
                        return <label key={name}>
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
        this.props.onSubmit(this.state.values);
    }
}
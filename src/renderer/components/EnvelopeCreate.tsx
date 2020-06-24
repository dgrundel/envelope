import { Currency } from "@/util/Currency";
import { AccountData, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from "react-redux";
import { insertAccount } from "../store/actions/Account";
import { CommonValidators, FieldValue, FormValidator } from './forms/FormValidator';
import { TextField } from "./forms/TextField";

export interface EnvelopeCreateProps {
    insertAccount?: (accountData: AccountData) => void;
}

export interface EnvelopeCreateState {
    values: Record<string, any>;
    errors: Record<string, string>;
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required()
}];

class Component extends React.Component<EnvelopeCreateProps, EnvelopeCreateState> {
    private readonly validator: FormValidator;

    constructor(props: EnvelopeCreateProps) {
        super(props);

        this.validator = new FormValidator(fieldValidators, this.onFieldChange.bind(this));
        this.state = {
            values: {},
            errors: {}
        };
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            <TextField
                name="name"
                label="Account Name"
                value={this.state.values.name || ''}
                error={this.state.errors.name}
                onChange={(e) => this.validator.setValue('name', e.target.value)}
            />
            <div>
                <button className="btn" type="submit">
                    Save
                </button>
            </div>
        </form>;
    }

    onFieldChange(fieldName: string, fieldValue: FieldValue) {
        const values = this.validator.values();
        const errors = this.validator.errors();
        this.setState({
            values,
            errors
        });
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        if (this.validator.allValid()) {
            const values = this.validator.values();

            const account: AccountData = {
                name: (values.name as string || '').trim(),
                type: AccountType.UserEnvelope,
                balance: Currency.ZERO,
                linkedAccountIds: []
            };
            
            this.props.insertAccount && this.props.insertAccount(account);

        } else {
            const errors = this.validator.errors();
            this.setState({
                errors
            });
        }
    }
}

export const EnvelopeCreate = connect(null, { insertAccount })(Component);
import * as React from "react";
import { TextField } from "./forms/TextField";
import { RadioSelectField } from "./forms/RadioSelectField";
import { getUserAccountTypes, getAccountTypeLabel, AccountType, Account, AccountDataStoreClient } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import { Currency } from "@/util/Currency";
import { FormValidator, CommonValidators, FieldValue } from './forms/FormValidator';

export interface AccountCreateProps {

}

export interface AccountCreateState {
    values: Record<string, any>;
    errors: Record<string, string>;
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required('Name')
}, {
    name: 'type',
    validator: CommonValidators.accountType()
}, {
    name: 'balance',
    validator: CommonValidators.currency()
}];

export class AccountCreate extends React.Component<AccountCreateProps, AccountCreateState> {
    private readonly validator: FormValidator;

    constructor(props: AccountCreateProps) {
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
                onChange={(e) => this.validator.setValue('name', e.target.value.trim())}
            />
            <RadioSelectField
                name="type"
                label="Account Type"
                value={this.state.values.type}
                error={this.state.errors.type}
                options={getUserAccountTypes().map(value => ({
                    value,
                    label: getAccountTypeLabel(value)
                }))}
                onChange={(e) => this.validator.setValue('type', e.target.value)}
            />
            <TextField
                name="balance"
                label="Current Balance"
                value={this.state.values.balance || ''}
                error={this.state.errors.balance}
                onChange={(e) => this.validator.setValue('balance', e.target.value.trim())}
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

            const balance = Currency.parse(values.balance as string || '');
            const account: Account = {
                name: values.name as string,
                type: values.type as AccountType,
                balanceWholeAmount: balance.isValid() ? balance.wholeAmount : 0,
                balancefractionalAmount: balance.isValid() ? balance.fractionalAmount : 0
            };
            const client = new AccountDataStoreClient();
            client.addAccount(account)
                .then(created => Log.debug('Created account', created))
                .catch(reason => Log.error('Error during add account', reason));
        } else {
            const errors = this.validator.errors();
            this.setState({
                errors
            });
        }
    }
}
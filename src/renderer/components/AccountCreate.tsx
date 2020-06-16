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
    valid: boolean;
    name?: string;
    nameError?: any;
    type?: AccountType;
    typeError?: any;
    balance?: string;
    balanceError?: any;
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
            valid: false
        };
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            <TextField
                name="name"
                label="Account Name"
                value={this.state.name || ''}
                error={this.state.nameError}
                onChange={(e) => this.validator.setValue('name', e.target.value.trim())}
            />
            <RadioSelectField
                name="type"
                label="Account Type"
                value={this.state.type}
                error={this.state.typeError}
                options={getUserAccountTypes().map(value => ({
                    value,
                    label: getAccountTypeLabel(value)
                }))}
                onChange={(e) => this.validator.setValue('type', e.target.value)}
            />
            <TextField
                name="balance"
                label="Current Balance"
                value={this.state.balance || ''}
                error={this.state.balanceError}
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
        const errors = this.validator.errors();
        const newState = {
            nameError: errors.name,
            typeError: errors.type,
            balanceError: errors.balance
        };
        (newState as any)[fieldName] = fieldValue;
        this.setState(newState);
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        if (this.validator.allValid()) {
            const balance = Currency.parse(this.state.balance || '');
            const account: Account = {
                name: this.state.name as string,
                type: this.state.type as AccountType,
                balanceWholeAmount: balance.isValid() ? balance.wholeAmount : 0,
                balancefractionalAmount: balance.isValid() ? balance.fractionalAmount : 0
            };
            const client = new AccountDataStoreClient();
            client.addAccount(account)
                .then(created => {
                    Log.debug(created);
                });
        } else {
            const errors = this.validator.errors();
            this.setState({
                nameError: errors.name,
                typeError: errors.type,
                balanceError: errors.balance
            });
        }
    }
}
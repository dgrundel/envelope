import { Currency } from "@/util/Currency";
import { ChoiceGroup, PrimaryButton, TextField, MessageBar, MessageBarType } from '@fluentui/react';
import { AccountType, getAccountTypeLabel, getBankAccountTypes } from '@models/Account';
import * as React from "react";
import { connect } from "react-redux";
import { createBankAccount } from "../../store/actions/Account";
import { CommonValidators, FieldValue, FormValidator } from '../../../util/FormValidator';

export interface AccountCreateProps {
    createBankAccount?: (name: string, type: AccountType, balance: Currency) => Promise<void>;
}

export interface AccountCreateState {
    values: Record<string, any>;
    errors: Record<string, string>;
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required()
}, {
    name: 'type',
    validator: CommonValidators.accountType()
}, {
    name: 'balance',
    validator: CommonValidators.currency()
}];

class Component extends React.Component<AccountCreateProps, AccountCreateState> {
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
                errorMessage={this.state.errors.name}
                onChange={(e, value?) => this.validator.setValue('name', value)}
            />
            <ChoiceGroup 
                name="type"
                label="Account Type" 
                selectedKey={this.state.values.type} 
                options={getBankAccountTypes().map(key => ({
                    key,
                    text: getAccountTypeLabel(key)
                }))}
                onChange={(e, option) => this.validator.setValue('type', option?.key)} 
            />
            {this.state.errors.type && <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>{this.state.errors.type}</MessageBar>}
            <TextField
                name="balance"
                label="Current Balance"
                value={this.state.values.balance || ''}
                errorMessage={this.state.errors.balance}
                onChange={(e, value?) => this.validator.setValue('balance', value)}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Save" />
            </p>
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
            
            const accountName = (values.name as string);
            const accountType = (values.type as AccountType);
            const balance = Currency.parse(values.balance as string).or(Currency.ZERO);
            
            this.props.createBankAccount!(accountName, accountType, balance);

        } else {
            const errors = this.validator.errors();
            this.setState({
                errors
            });
        }
    }
}

export const AccountCreate = connect(null, { createBankAccount })(Component);
import * as React from "react";
import { TextField } from "./forms/TextField";
import { RadioSelectField } from "./forms/RadioSelectField";
import { getUserAccountTypes, getAccountTypeLabel, AccountType, Account, AccountDataStoreClient } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import { Currency } from "@/util/Currency";

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

export class AccountCreate extends React.Component<AccountCreateProps, AccountCreateState> {

    constructor(props: AccountCreateProps) {
        super(props);

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
                onChange={(e) => this.onNameChange(e)}
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
                onChange={(e) => this.onAccountTypeChange(e)}
            />
            <TextField
                name="balance"
                label="Current Balance"
                value={this.state.balance || ''}
                error={this.state.balanceError}
                onChange={(e) => this.onBalanceChange(e)}
            />
            <div>
                <button className="btn" type="submit">
                    Save
                </button>
            </div>
        </form>;
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        if (this.state.valid) {
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
        }
    }

    onNameChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const name = e.target.value.trim();
        this.setState(prev => this.validate(prev, { name }));
    }

    onAccountTypeChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const type = (e.target.value as AccountType);
        this.setState(prev => this.validate(prev, { type }));
    }
    
    onBalanceChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const balance = e.target.value;
        this.setState(prev => this.validate(prev, { balance }));
    }

    validate(prev: AccountCreateState, updates: any): AccountCreateState {
        const name = updates.hasOwnProperty('name') ? updates.name : prev.name;
        const nameValid = name && name.length > 0;
        updates.nameError = nameValid ? undefined : 'Please enter a name.';
        
        const type = updates.hasOwnProperty('type') ? updates.type : prev.type;
        const typeValid = !!type;
        updates.typeError = typeValid ? undefined : 'Please select an account type.';
        
        const balance = updates.hasOwnProperty('balance') ? updates.balance : prev.balance;
        const balanceValid = (balance && balance.length) ? Currency.parse(balance).isValid() : true;
        updates.balanceError = balanceValid ? undefined : 'Hmm, this doesn\'t look like a number.';
        
        updates.valid = !!(nameValid && typeValid && balanceValid);

        return updates;
    }
}
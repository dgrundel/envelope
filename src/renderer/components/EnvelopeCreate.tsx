import * as React from "react";
import { TextField } from "./forms/TextField";
import { RadioSelectField } from "./forms/RadioSelectField";
import { Account, AccountType, AccountData } from '@models/Account';
import { AccountDataStoreClient } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import { Currency } from "@/util/Currency";
import { FormValidator, CommonValidators, FieldValue } from './forms/FormValidator';

export interface EnvelopeCreateProps {

}

export interface EnvelopeCreateState {
    values: Record<string, any>;
    errors: Record<string, string>;
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required()
}];

export class EnvelopeCreate extends React.Component<EnvelopeCreateProps, EnvelopeCreateState> {
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
            const client = new AccountDataStoreClient();
            client.addAccount(account)
                .then(created => Log.debug('Created envelope account', created))
                .catch(reason => {
                    Log.error('Error during add envelope account', reason);
                    // errorType: "uniqueViolated"
                    // key: "test"
                    // message: "Can't insert key test, it violates the unique constraint"

                    // TODO: show error to user.
                });
        } else {
            const errors = this.validator.errors();
            this.setState({
                errors
            });
        }
    }
}
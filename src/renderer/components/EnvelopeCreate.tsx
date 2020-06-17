import * as React from "react";
import { TextField } from "./forms/TextField";
import { RadioSelectField } from "./forms/RadioSelectField";
import { getUserAccountTypes, getAccountTypeLabel, AccountType, Account, AccountDataStoreClient } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import { Currency } from "@/util/Currency";
import { FormValidator, CommonValidators, FieldValue } from './forms/FormValidator';
import { FormContainer } from './forms/FormContainer';

export interface EnvelopeCreateProps {

}

export interface EnvelopeCreateState {
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required('Name')
}];

export class EnvelopeCreate extends React.Component<EnvelopeCreateProps, EnvelopeCreateState> {
    private readonly validator: FormValidator;

    constructor(props: EnvelopeCreateProps) {
        super(props);

        this.validator = new FormValidator(fieldValidators);
        this.state = {
        };
    }

    render() {
        return <FormContainer validator={this.validator} onSubmit={() => this.onSubmit()}>
            <TextField
                name="name"
                label="Account Name"
                value={this.validator.getInputValue('name') as string}
                error={this.validator.getError('name') as string}
                onChange={(e) => this.validator.setValue('name', e.target.value)}
            />
        </FormContainer>
    }

    onSubmit() {
        
        if (this.validator.allValid()) {
            const values = this.validator.values();

            const account: Account = {
                name: (values.name as string || '').trim(),
                type: AccountType.EnvelopeUser,
                balanceWholeAmount: 0,
                balancefractionalAmount: 0
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
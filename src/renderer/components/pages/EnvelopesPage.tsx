import * as React from "react";
import { Box } from '../Box';
import { Account, AccountDataStoreClient, AccountType } from '@/dataStore/impl/AccountDataStore';
import { DataTable } from '../DataTable';
import { Form, FormField, FormFieldValues } from '../Form';
import { Log } from '@/util/Logger';
import { EventListener } from '../EventListener';


export interface EnvelopesPageProps {
}

export interface EnvelopesPageState {
    dataStore: AccountDataStoreClient;
    userEnvelopes: Account[];
    creditCardEnvelopes: Account[];
}

export class EnvelopesPage extends EventListener<EnvelopesPageProps, EnvelopesPageState> {
    
    constructor(props: EnvelopesPageProps) {
        super(props);

        this.state = {
            dataStore: new AccountDataStoreClient(),
            userEnvelopes: [],
            creditCardEnvelopes: []
        };

        this.updateEnvelopes();
        this.addListener(() => this.state.dataStore.onChange(() => {
            this.updateEnvelopes();
        }));
    }
    
    private updateEnvelopes() {
        this.state.dataStore.getCreditCardEnvelopes().then(creditCardEnvelopes => {
            this.setState({ creditCardEnvelopes });
        });
        this.state.dataStore.getUserEnvelopes().then(userEnvelopes => {
            this.setState({ userEnvelopes });
        });
    }

    render() {
        const formFields: FormField[] = [{
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true
        }];

        const onSubmit = (values: FormFieldValues) => {
            const account: Account = {
                name: values.name,
                type: AccountType.EnvelopeUser,
                balanceWholeAmount: 0,
                balancefractionalAmount: 0
            };
            
            this.state.dataStore.addAccount(account)
                .then(res => Log.debug(res));
        };
        
        return <>
            <Box heading="Create an Envelope">
                <Form
                    fields={formFields}
                    onSubmit={onSubmit}
                    submitLabel="Save"
                />
            </Box>
            <Box heading="My Credit Card Payments">
                <DataTable<Account>
                    rows={this.state.creditCardEnvelopes}
                    fields={[{
                        name: 'name',
                        label: 'Envelope Name'
                    }]}
                    keyField={'_id'}
                />
            </Box>
            <Box heading="My Envelopes">
                <DataTable<Account>
                    rows={this.state.userEnvelopes}
                    fields={[{
                        name: 'name',
                        label: 'Envelope Name'
                    }]}
                    keyField={'_id'}
                />
            </Box>
        </>;
    }
}
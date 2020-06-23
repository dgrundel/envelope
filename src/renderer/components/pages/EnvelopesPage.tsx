import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Account } from '@models/Account';
import * as React from "react";
import { Box } from '../Box';
import { DataTable } from '../DataTable';
import { EnvelopeCreate } from '../EnvelopeCreate';
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
        return <>
            <Box heading="Create an Envelope">
                <EnvelopeCreate/>
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
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Box } from '../Box';
import { DataTable } from '../DataTable';
import { EnvelopeCreate } from '../EnvelopeCreate';
import { filterOnlyAccountType } from '@/util/Filters';
import { Stack } from '@fluentui/react';
import { Layout } from '../Layout';

export interface EnvelopesPageProps {
    userEnvelopes?: Account[];
    creditCardEnvelopes?: Account[];
    unallocatedAccount?: Account;
}

export interface EnvelopesPageState {
}

class Component extends React.Component<EnvelopesPageProps, EnvelopesPageState> {
    
    constructor(props: EnvelopesPageProps) {
        super(props);

        this.state = {};
    }
    
    render() {
        return <>
            <Layout cols={2}>
                <Box heading="Create an Envelope">
                    <EnvelopeCreate/>
                </Box>
                <Box heading="Available">
                    {this.props.unallocatedAccount?.balance.toFormattedString()}
                </Box>
            </Layout>
            
            {this.renderCreditCardEnvelopes()}
            {this.renderUserEnvelopes()}
        </>;
    }
    renderUserEnvelopes() {
        const envelopes = this.props.userEnvelopes || [];

        if (envelopes.length === 0) {
            return null;
        }

        return <Box heading="My Envelopes">
            <DataTable<Account>
                rows={envelopes}
                fields={[{
                    name: 'name',
                    label: 'Envelope Name'
                },{
                    name: 'balance',
                    label: 'Available',
                    formatter: (value: Currency) => value.toFormattedString()
                }]}
                keyField={'_id'}
            />
        </Box>;
    }

    renderCreditCardEnvelopes() {
        const envelopes = this.props.creditCardEnvelopes || [];

        if (envelopes.length === 0) {
            return null;
        }
        
        return <Box heading="My Credit Card Payments">
            <DataTable<Account>
                rows={envelopes}
                fields={[{
                    name: 'name',
                    label: 'Envelope Name'
                },{
                    name: 'balance',
                    label: 'Available',
                    formatter: (value: Currency) => value.toFormattedString()
                }]}
                keyField={'_id'}
            />
        </Box>
    }
}

const mapStateToProps = (state: CombinedState, ownProps: EnvelopesPageProps): EnvelopesPageProps => {
    const allAcounts = state.accounts.sortedIds.map(id => state.accounts.accounts[id]);
    const unallocatedId = state.accounts.unallocatedId;
    return {
        ...ownProps,
        userEnvelopes: allAcounts.filter(filterOnlyAccountType(AccountType.UserEnvelope)),
        creditCardEnvelopes: allAcounts.filter(filterOnlyAccountType(AccountType.PaymentEnvelope)),
        unallocatedAccount: unallocatedId ? state.accounts.accounts[unallocatedId] : undefined
    };
}

export const EnvelopesPage = connect(mapStateToProps, {})(Component); 
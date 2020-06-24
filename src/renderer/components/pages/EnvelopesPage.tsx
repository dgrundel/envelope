import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Box } from '../Box';
import { DataTable } from '../DataTable';
import { EnvelopeCreate } from '../EnvelopeCreate';

export interface EnvelopesPageProps {
    userEnvelopes?: Account[];
    creditCardEnvelopes?: Account[];
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
            <Box heading="Create an Envelope">
                <EnvelopeCreate/>
            </Box>
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
    return {
        ...ownProps,
        userEnvelopes: allAcounts.filter(account => account.type === AccountType.UserEnvelope),
        creditCardEnvelopes: allAcounts.filter(account => account.type === AccountType.PaymentEnvelope)
    };
}

export const EnvelopesPage = connect(mapStateToProps, {})(Component); 
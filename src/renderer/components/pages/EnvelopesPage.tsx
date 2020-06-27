import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Box } from '../Box';
import { DataTable } from '../DataTable';
import { EnvelopeCreate } from '../EnvelopeCreate';
import { filterOnlyAccountType } from '@/util/Filters';
import { Text } from '@fluentui/react';
import { Layout } from '../Layout';
import { MoveMoney } from '../MoveMoney';

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
                    <p><Text variant={'xxLarge'}>{this.props.unallocatedAccount?.balance.toFormattedString()}</Text></p>

                    <MoveMoney fromId={this.props.unallocatedAccount?._id} showFrom={false}/>
                </Box>
            </Layout>
            
            <Layout cols={3}>
                {this.renderCreditCardEnvelopes()}
                {this.renderUserEnvelopes()}
            </Layout>
            
        </>;
    }

    renderCreditCardEnvelopes() {
        return this.props.creditCardEnvelopes!.map(envelope => <Box key={envelope._id} heading={envelope.name}>
            <p><Text variant={'xxLarge'}>{envelope.balance.toFormattedString()}</Text></p>
        </Box>);
    }
    
    renderUserEnvelopes() {
        return this.props.userEnvelopes!.map(envelope => <Box key={envelope._id} heading={envelope.name}>
            <p><Text variant={'xxLarge'}>{envelope.balance.toFormattedString()}</Text></p>
        </Box>)
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
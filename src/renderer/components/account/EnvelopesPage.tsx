import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Box } from '../uiElements/Box';
import { DataTable } from '../uiElements/DataTable';
import { EnvelopeCreate } from './EnvelopeCreate';
import { filterOnlyAccountType } from '@/util/Filters';
import { Text, IconButton } from '@fluentui/react';
import { Layout } from '../uiElements/Layout';
import { MoveMoney } from '../transaction/MoveMoney';
import { BaseModal } from '../uiElements/Modal';
import { getAppContext } from '@/renderer/AppContext';

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
                {this.props.creditCardEnvelopes!.map(e => this.renderEnvelope(e))}
                {this.props.userEnvelopes!.map(e => this.renderEnvelope(e))}
            </Layout>
            
        </>;
    }

    renderEnvelope(envelope: Account) {
        return <Box key={envelope._id} heading={envelope.name}>
            <p><Text variant={'xxLarge'}>{envelope.balance.toFormattedString()}</Text></p>
            <p>
                <IconButton iconProps={({ iconName: 'CalculatorAddition' })} title="Add" onClick={() => this.showAddMoneyModal(envelope)} />
                <IconButton iconProps={({ iconName: 'CalculatorSubtract' })} title="Remove" onClick={() => this.showRemoveMoneyModal(envelope)} />
            </p>
        </Box>;
    }

    showRemoveMoneyModal(envelope: Account) {
        const dismiss = () => {
            getAppContext().modalApi.dismissModal();
        };

        const modal = <BaseModal heading={`Remove money from ${envelope.name}`} closeButtonHandler={dismiss}>
            <MoveMoney fromId={envelope._id} showFrom={false} onComplete={dismiss}/>
        </BaseModal>;

        getAppContext().modalApi.queueModal(modal);
    }

    showAddMoneyModal(envelope: Account) {
        const dismiss = () => {
            getAppContext().modalApi.dismissModal();
        };

        const modal = <BaseModal heading={`Add money to ${envelope.name}`} closeButtonHandler={dismiss}>
            <MoveMoney toId={envelope._id} showTo={false} onComplete={dismiss}/>
        </BaseModal>;

        getAppContext().modalApi.queueModal(modal);
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
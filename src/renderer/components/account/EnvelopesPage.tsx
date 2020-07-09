import { CombinedState } from '@/renderer/store/store';
import { filterOnlyAccountType } from '@/util/Filters';
import { IconButton, Text } from '@fluentui/react';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { MoveMoney } from '../transaction/MoveMoney';
import { Box } from '../uiElements/Box';
import { Layout } from '../uiElements/Layout';
import { BaseModal } from '../uiElements/Modal';
import { EnvelopeCreate } from './EnvelopeCreate';
import { setModal, dismissModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';

export interface EnvelopesPageProps {
    // mapped from state
    userEnvelopes?: Account[];
    creditCardEnvelopes?: Account[];
    unallocatedAccount?: Account;

    //store actions
    setModal?: (modal: Modal) => void;
    dismissModal?: () => void;
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
            <Box heading="Available">
                <Layout cols={2}>
                    <p><Text variant={'xxLarge'}>{this.props.unallocatedAccount?.balance.toFormattedString()}</Text></p>

                    <MoveMoney fromId={this.props.unallocatedAccount?._id} showFrom={false}/>
                </Layout>
            </Box>
            
            <Layout cols={3}>
                <Box heading="Create an Envelope">
                    <EnvelopeCreate/>
                </Box>
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
        const setModal = this.props.setModal!;
        const dismissModal = this.props.dismissModal!;

        const modal = <BaseModal heading={`Remove money from ${envelope.name}`} closeButtonHandler={dismissModal}>
            <MoveMoney fromId={envelope._id} showFrom={false} onComplete={dismissModal}/>
        </BaseModal>;

        setModal(modal);
    }

    showAddMoneyModal(envelope: Account) {
        const setModal = this.props.setModal!;
        const dismissModal = this.props.dismissModal!;

        // if the envelope is negative, suggest getting it back to zero
        const suggestedAmount = envelope.balance.isNegative() ? envelope.balance.getInverse() : undefined;

        const modal = <BaseModal heading={`Add money to ${envelope.name}`} closeButtonHandler={dismissModal}>
            <MoveMoney toId={envelope._id} showTo={false} onComplete={dismissModal} amount={suggestedAmount} />
        </BaseModal>;

        setModal(modal);
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

const storeActions = {
    setModal,
    dismissModal,
};

export const EnvelopesPage = connect(mapStateToProps, storeActions)(Component); 
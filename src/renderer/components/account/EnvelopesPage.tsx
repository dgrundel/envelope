import { dismissModal, setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { filterOnlyAccountType } from '@/util/Filters';
import { IconButton, Text, Separator } from '@fluentui/react';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { MoveMoney } from '../transaction/MoveMoney';
import { Card } from '../uiElements/Card';
import { Layout } from '../uiElements/Layout';
import { BaseModal } from '../uiElements/Modal';
import { EnvelopeCreate } from './EnvelopeCreate';

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
        const unallocatedAccount = (this.props.unallocatedAccount!);

        return <>
            <Layout split={2}>
                <Card heading="Available">
                    <p className={unallocatedAccount.balance.lt(Currency.ZERO) ? 'color-error' : ''}>
                        <Text variant={'xxLarge'}>{unallocatedAccount.balance.toFormattedString()}</Text>

                        {/* <IconButton iconProps={({ iconName: 'NewMail' })} title="Move Money to Envelope" onClick={() => this.showRemoveMoneyModal(unallocatedAccount)} /> */}
                    </p>

                    <MoveMoney fromId={unallocatedAccount._id} showFrom={false}/>
                </Card>
                <Card heading="Create an Envelope">
                    <EnvelopeCreate/>
                </Card>
            </Layout>
            
            <Layout split={3}>
                {this.props.creditCardEnvelopes!.map(e => this.renderEnvelope(e))}
                {this.props.userEnvelopes!.map(e => this.renderEnvelope(e))}
            </Layout>
        </>;
    }

    renderEnvelope(envelope: Account) {
        return <Card key={envelope._id} heading={envelope.name}>
            <p className={envelope.balance.lt(Currency.ZERO) ? 'color-error' : ''}>
                <Text variant={'xxLarge'}>{envelope.balance.toFormattedString()}</Text>
            </p>
            <p>
                <IconButton iconProps={({ iconName: 'CalculatorAddition' })} title="Add Money" onClick={() => this.showAddMoneyModal(envelope)} />
                <IconButton iconProps={({ iconName: 'CalculatorSubtract' })} title="Remove Money" onClick={() => this.showRemoveMoneyModal(envelope)} />
            </p>
        </Card>;
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
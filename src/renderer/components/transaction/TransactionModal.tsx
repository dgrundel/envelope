import { Transaction } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { mergeStyles, MessageBar, MessageBarButton, MessageBarType, Text } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { getAppContext } from '../../AppContext';
import { CombinedState } from '../../store/store';
import { BaseModal, Modal } from '../uiElements/Modal';
import { createLinkWizard } from './linkWizard/LinkWizardFactory';
import { TransactionCard } from './TransactionCard';

export interface AddLinkedTransactionsProps {
    transaction: Transaction;
    unlinkedBalance: Currency;

    // mapped props from state
    accountMap?: Record<string, Account>;
    existingLinks?: Transaction[];
}

class Component extends React.Component<AddLinkedTransactionsProps, {}> implements Modal {

    render() {
        const dismissModal = getAppContext().modalApi.dismissModal;

        return <BaseModal heading="Transaction Details" closeButtonHandler={dismissModal}>
            <TransactionCard transaction={this.props.transaction}/>
            {this.renderLinkWizardMessage()}
        </BaseModal>;
    }

    renderLinkWizardMessage(): any {
        const onClick = () => {
            const WizardComponent = createLinkWizard(this.props.transaction);
            getAppContext().modalApi.replaceModal(<WizardComponent/>);
        };
        
        return <MessageBar
            messageBarType={MessageBarType.warning}
            actions={
                <MessageBarButton onClick={onClick}>Reconcile Now</MessageBarButton>
            }
        >
            This transaction has not been reconciled yet.
        </MessageBar>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AddLinkedTransactionsProps): AddLinkedTransactionsProps => ({
    ...ownProps,
    accountMap: state.accounts.accounts,
    existingLinks: ownProps.transaction.linkedTransactionIds.map(id => state.transactions.transactions[id])
})

export const TransactionModal = connect(mapStateToProps, {})(Component);
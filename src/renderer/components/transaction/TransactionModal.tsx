import { Transaction, TransactionFlag } from '@/models/Transaction';
import { Modal } from '@/renderer/store/reducers/AppState';
import { Currency } from '@/models/Currency';
import { hasFlag } from '@/util/Flags';
import { MessageBar, MessageBarButton, MessageBarType } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../../store/store';
import { BaseModal } from '../uiElements/Modal';
import { createLinkWizard } from './linkWizard/LinkWizardFactory';
import { TransactionCard } from './TransactionCard';
import { setModal, dismissModal } from '@/renderer/store/actions/AppState';

export interface AddLinkedTransactionsProps {
    transaction: Transaction;

    // mapped props from state
    accountMap?: Record<string, Account>;
    existingLinks?: Transaction[];

    // store actions
    setModal?: (modal: Modal) => void;
    dismissModal?: () => void;
}

class Component extends React.Component<AddLinkedTransactionsProps, {}> implements Modal {

    render() {
        const dismissModal = this.props.dismissModal!;

        return <BaseModal heading="Transaction Details" closeButtonHandler={dismissModal}>
            <TransactionCard transaction={this.props.transaction}/>
            {this.renderLinkWizardMessage()}
        </BaseModal>;
    }

    renderLinkWizardMessage(): any {
        const setModal = this.props.setModal!;

        const isReconciled = hasFlag(TransactionFlag.Reconciled, this.props.transaction.flags);
        if (isReconciled) {
            return null;
        }

        const onClick = () => {
            const WizardComponent = createLinkWizard(this.props.transaction);
            setModal(<WizardComponent/>);
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

const mappedActions = {
    setModal,
    dismissModal,
};

export const TransactionModal = connect(mapStateToProps, mappedActions)(Component);
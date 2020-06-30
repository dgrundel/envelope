import { Transaction } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { getAppContext } from '../../AppContext';
import { CombinedState } from '../../store/store';
import { DataTable } from '../uiElements/DataTable';
import { BaseModal, Modal, ModalButton } from '../uiElements/Modal';
import { Section } from '../uiElements/Section';
import { AddLinks } from './AddLinks';


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
        const transaction = this.props.transaction;
        const accounts = this.props.accountMap || {};

        const modalButtons: ModalButton[] = [{
            buttonText: 'Close',
            onClick: () => dismissModal()
        }];

        return <BaseModal heading="Add Linked Transactions" buttons={modalButtons} closeButtonHandler={() => dismissModal()}>
            <div className="add-linked-transactions">

                <div className="add-linked-transactions-transaction">
                    <table>
                        <tbody>
                            <tr>
                                <th>Account</th>
                                <td>{accounts[transaction.accountId]?.name}</td>
                            </tr>
                            <tr>
                                <th>Date</th>
                                <td>{transaction.date.toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <th>Amount</th>
                                <td>{transaction.amount.toFormattedString()}</td>
                            </tr>
                            <tr>
                                <th>Description</th>
                                <td>{transaction.description}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {this.renderExistingLinks()}

                {this.renderForm()}
            </div>
        </BaseModal>;
    }

    renderExistingLinks() {
        const existingLinks = this.props.existingLinks || [];
        const accounts = this.props.accountMap || {};

        if (existingLinks.length === 0) {
            return;
        }

        return <Section heading="Envelopes">
            <DataTable<Transaction>
                rows={existingLinks}
                fields={[{
                    name: 'accountId',
                    label: 'Envelope',
                    formatter: (value: string) => accounts[value].name
                },{
                    name: 'amount',
                    label: 'Amount',
                    formatter: (value: Currency) => value.toFormattedString()
                }]}
                keyField={'_id'}
            />
        </Section>;
    }

    renderForm() {
        if (this.props.unlinkedBalance.isZero()) {
            return null;
        }

        return <Section heading="Link to Envelope">
            <AddLinks linkTo={this.props.transaction} unlinkedBalance={this.props.unlinkedBalance}/>
        </Section>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AddLinkedTransactionsProps): AddLinkedTransactionsProps => ({
    ...ownProps,
    accountMap: state.accounts.accounts,
    existingLinks: ownProps.transaction.linkedTransactionIds.map(id => state.transactions.transactions[id])
})

export const LinkedTransactionsModal = connect(mapStateToProps, {})(Component);
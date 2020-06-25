import { Transaction, TransactionData } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';
import { Dropdown, MessageBar, MessageBarType, PrimaryButton, TextField } from '@fluentui/react';
import { Account, getAssignableAccountTypes } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { getAppContext } from '../AppContext';
import { addLinkedTransaction } from '../store/actions/Transaction';
import { CombinedState } from '../store/store';
import { DataTable } from './DataTable';
import { CommonValidators, FieldValue, FormValidator } from '../../util/FormValidator';
import { BaseModal, Modal, ModalButton } from './Modal';
import { Section } from './Section';


export interface AddLinkedTransactionsProps {
    transaction: Transaction;
    suggestedValue: Currency;
    maxValue: Currency;
    accountMap?: Record<string, Account>;
    envelopes?: Account[];
    existingLinks?: Transaction[];
    addLinkedTransaction?: (transaction: TransactionData, linkTo: Transaction) => void;
}

export interface AddLinkedTransactionsState {
    formValues: Record<string, any>;
    formErrors: Record<string, string>;
}

class Component extends React.Component<AddLinkedTransactionsProps, AddLinkedTransactionsState> implements Modal {
    private readonly validator: FormValidator;

    constructor(props: AddLinkedTransactionsProps) {
        super(props);

        const fieldValidators = [{
            name: 'accountId',
            validator: CommonValidators.required()
        },{
            name: 'amount',
            validator: CommonValidators.chain(
                CommonValidators.required(),
                CommonValidators.currencyMax(props.maxValue),
                CommonValidators.currencyPositive()
            ),
            value: props.suggestedValue.toString()
        }];

        this.validator = new FormValidator(fieldValidators, this.onFieldChange.bind(this));
        this.state = {
            formValues: this.validator.values(),
            formErrors: this.validator.errors()
        };
    }

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
        if (this.props.maxValue.isZero()) {
            return null;
        }

        const envelopes = this.props.envelopes || [];
        if (envelopes.length === 0) {
            return;
        }

        return <Section heading="Link to Envelope">
            <form onSubmit={e => this.onSubmitTransaction(e)}>
                <Dropdown
                    label="Envelope"
                    selectedKey={this.state.formValues.accountId}
                    onChange={(e, option) => this.validator.setValue('accountId', option?.key.toString())}
                    placeholder="Select an Envelope"
                    options={envelopes.map(envelope => ({
                        key: envelope._id,
                        text: envelope.name
                    }))}
                />
                {this.state.formErrors.accountId && <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>{this.state.formErrors.accountId}</MessageBar>}
                <TextField
                    label="Amount"
                    value={this.state.formValues.amount || ''}
                    errorMessage={this.state.formErrors.amount}
                    onChange={(e, value?) => this.validator.setValue('amount', value)}
                />
                <div>
                    <PrimaryButton type="submit" text="Add" />
                </div>
            </form>
        </Section>;
    }

    onFieldChange(fieldName: string, fieldValue: FieldValue) {
        this.setState({
            formValues: this.validator.values(),
            formErrors: this.validator.errors()
        });
    }

    onSubmitTransaction(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        if (this.validator.allValid()) {
            const values = this.validator.values();
            Log.debug('submitted linked transaction form', values);

            const amount = Currency.parse(values.amount as string);
            const date = new Date();

            const transactionData: TransactionData = {
                accountId: values.accountId as string,
                date: date,
                amount: amount,
                description: `Linked from ${this.props.transaction._id}`,
                linkedTransactionIds: []
            };

            this.props.addLinkedTransaction && this.props.addLinkedTransaction(transactionData, this.props.transaction);
            
        } else {
            this.setState({
                formErrors: this.validator.errors()
            });
        }
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AddLinkedTransactionsProps): AddLinkedTransactionsProps => ({
    ...ownProps,
    accountMap: state.accounts.accounts,
    envelopes: state.accounts.sortedIds
        .map(id => state.accounts.accounts[id])
        .filter(account => getAssignableAccountTypes().some(t => t === account.type)),
    existingLinks: ownProps.transaction.linkedTransactionIds.map(id => state.transactions.transactions[id])
})

export const AddLinkedTransactions = connect(mapStateToProps, { addLinkedTransaction })(Component);
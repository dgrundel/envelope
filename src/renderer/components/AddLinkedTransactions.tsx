import { Transaction, TransactionData } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';
import { Account, getAssignableAccountTypes } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { getAppContext } from '../AppContext';
import { insertTransaction } from '../store/actions/Transaction';
import { CombinedState } from '../store/store';
import { DataTable } from './DataTable';
import { CommonValidators, FieldValue, FormValidator } from './forms/FormValidator';
import { SelectField } from './forms/SelectField';
import { TextField } from './forms/TextField';
import { BaseModal, Modal, ModalButton } from './Modal';
import { Section } from './Section';


export interface AddLinkedTransactionsProps {
    transaction: Transaction;
    suggestedValue: Currency;
    maxValue: Currency;
    accountMap?: Record<string, Account>;
    envelopes?: Account[];
    existingLinks?: Transaction[];
    insertTransaction?: (t: TransactionData) => void;
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
        
        if (existingLinks.length === 0) {
            return;
        }

        return <Section heading="Envelopes">
            <DataTable<Transaction>
                rows={existingLinks}
                fields={[{
                    name: 'accountName',
                    label: 'Envelope'
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

        const accountIdSelectOptions = envelopes.map(envelope => ({
            label: envelope.name,
            value: envelope._id
        }));

        return <Section heading="Link to Envelope">
            <form onSubmit={e => this.onSubmitTransaction(e)}>
                <SelectField
                    name="accountId"
                    label="Envelope"
                    value={this.state.formValues.accountId || ''}
                    error={this.state.formErrors.accountId}
                    onChange={(e) => this.validator.setValue('accountId', e.target.value)}
                    options={accountIdSelectOptions}
                />
                <TextField
                    name="amount"
                    label="Amount"
                    value={this.state.formValues.amount || ''}
                    error={this.state.formErrors.amount}
                    onChange={(e) => this.validator.setValue('amount', e.target.value)}
                />
                <div>
                    <button className="btn" type="submit">
                        Add
                    </button>
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
                linkedTransactionIds: [this.props.transaction._id]
            };

            this.props.insertTransaction && this.props.insertTransaction(transactionData);
            
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
        .filter(account => getAssignableAccountTypes().findIndex(t => t === account.type) !== -1),
    existingLinks: ownProps.transaction.linkedTransactionIds.map(id => state.transactions.transactions[id])
})

export const AddLinkedTransactions = connect(mapStateToProps, { insertTransaction })(Component);
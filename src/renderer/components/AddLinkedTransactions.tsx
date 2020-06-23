import { Account, AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction, TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';
import * as React from "react";
import { getAppContext } from '../AppContext';
import { DataTable } from './DataTable';
import { EventListener } from './EventListener';
import { CommonValidators, FieldValue, FormValidator } from './forms/FormValidator';
import { SelectField } from './forms/SelectField';
import { TextField } from './forms/TextField';
import { BaseModal, Modal, ModalButton } from './Modal';
import { Section } from './Section';


export interface AddLinkedTransactionsProps {
    transaction: Transaction;
    existingLinks?: Transaction[];
    suggestedValue: Currency;
    maxValue: Currency;
}

export interface AddLinkedTransactionsState {
    envelopes: Account[];
    linkedTransactions: Transaction[];
    formValues: Record<string, any>;
    formErrors: Record<string, string>;
}

export class AddLinkedTransactions extends EventListener<AddLinkedTransactionsProps, AddLinkedTransactionsState> implements Modal {
    private readonly validator: FormValidator;
    private readonly accountDataStore: AccountDataStoreClient;
    private readonly transactionDataStore: TransactionDataStoreClient;

    constructor(props: AddLinkedTransactionsProps) {
        super(props);

        const fieldValidators = [{
            name: 'accountName',
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
            envelopes: [],
            linkedTransactions: props.existingLinks || [],
            formValues: this.validator.values(),
            formErrors: this.validator.errors()
        };

        this.accountDataStore = new AccountDataStoreClient();
        this.transactionDataStore = new TransactionDataStoreClient();

        this.refreshEnvelopes();

        this.addListener(() => this.accountDataStore.onChange((change) => {
            this.refreshEnvelopes();
        }));
    }

    render() {
        const dismissModal = getAppContext().modalApi.dismissModal;
        const transaction = this.props.transaction;

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
                                <td>{transaction.accountName}</td>
                            </tr>
                            <tr>
                                <th>Date</th>
                                <td>{transaction.date.toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <th>Amount</th>
                                <td>{new Currency(transaction.wholeAmount, transaction.fractionalAmount).toFormattedString()}</td>
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
        if (this.state.linkedTransactions.length === 0) {
            return;
        }

        return <Section>
            <DataTable<Transaction>
                rows={this.state.linkedTransactions}
                fields={[{
                    name: 'accountName',
                    label: 'Envelope'
                },{
                    name: 'amount',
                    label: 'Amount',
                    formatter: (value, row) => new Currency(row.wholeAmount, row.fractionalAmount).toFormattedString()
                }]}
                keyField={'_id'}
            />
        </Section>;
    }

    renderForm() {
        if (this.props.maxValue.isZero()) {
            return null;
        }

        const accountNameSelectOptions = this.state.envelopes.map(envelope => ({
            value: envelope.name
        }));

        return <form onSubmit={e => this.onSubmitTransaction(e)}>
            <SelectField
                name="accountName"
                label="Envelope"
                value={this.state.formValues.accountName || ''}
                error={this.state.formErrors.accountName}
                onChange={(e) => this.validator.setValue('accountName', e.target.value)}
                options={accountNameSelectOptions}
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
        </form>;
    }

    refreshEnvelopes() {
        this.accountDataStore.getUserEnvelopes().then(envelopes => {
            this.setState({
                envelopes
            });
        })
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

            this.transactionDataStore.addLinkedTransaction({
                accountName: values.accountName as string,
                date: date,
                year: date.getFullYear(),
                month: date.getMonth(),
                wholeAmount: amount.wholeAmount,
                fractionalAmount: amount.fractionalAmount,
                description: `Linked from ${this.props.transaction._id}`
            }, this.props.transaction)
            .then(created => {
                Log.debug('Created transaction', created);
            })
            .catch(reason => {
                Log.error('Error during add transaction', reason);
            });
            
        } else {
            this.setState({
                formErrors: this.validator.errors()
            });
        }
    }
}
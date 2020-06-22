import { Account, AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction } from '@/dataStore/impl/TransactionDataStore';
import { Currency } from '@/util/Currency';
import * as React from "react";
import { getAppContext } from '../AppContext';
import { DataTable } from './DataTable';
import { EventListener } from './EventListener';
import { CommonValidators, FieldValue, FormValidator } from './forms/FormValidator';
import { SelectField } from './forms/SelectField';
import { TextField } from './forms/TextField';
import { BaseModal, Modal, ModalButton } from './Modal';
import { Log } from '@/util/Logger';


export interface AddLinkedTransactionsProps {
    transaction: Transaction;
    existingLinks?: Transaction[];
}

export interface AddLinkedTransactionsState {
    envelopes: Account[];
    linkedTransactions: Transaction[];
    formValues: Record<string, any>;
    formErrors: Record<string, string>;
}

const fieldValidators = [{
    name: 'accountName',
    validator: CommonValidators.required()
},{
    name: 'amount',
    validator: CommonValidators.chain(
        CommonValidators.required(),
        CommonValidators.currency()
    )
}];

export class AddLinkedTransactions extends EventListener<AddLinkedTransactionsProps, AddLinkedTransactionsState> implements Modal {
    private readonly validator: FormValidator;

    constructor(props: AddLinkedTransactionsProps) {
        super(props);

        this.validator = new FormValidator(fieldValidators, this.onFieldChange.bind(this));
        this.state = {
            envelopes: [],
            linkedTransactions: props.existingLinks || [],
            formValues: {},
            formErrors: {}
        };

        const accountDataStore = new AccountDataStoreClient();

        this.refreshEnvelopes(accountDataStore);

        this.addListener(() => accountDataStore.onChange((change) => {
            this.refreshEnvelopes(accountDataStore);
        }));
    }

    render() {
        const dismissModal = getAppContext().modalApi.dismissModal;
        const transaction = this.props.transaction;

        const buttons: ModalButton[] = [{
            buttonText: 'Close',
            onClick: () => dismissModal()
        }];

        return <BaseModal heading="Add Linked Transactions" buttons={buttons} closeButtonHandler={() => dismissModal()}>
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

                <DataTable<Transaction>
                    rows={this.state.linkedTransactions}
                    fields={[{
                        name: 'accountName',
                        label: 'Account'
                    },{
                        name: 'amount',
                        label: 'Amount',
                        formatter: (value, row) => new Currency(row.wholeAmount, row.fractionalAmount).toFormattedString()
                    }]}
                    keyField={'_id'}
                />

                <form onSubmit={e => this.onSubmitTransaction(e)}>
                    <SelectField
                        name="accountName"
                        label="Account"
                        value={this.state.formValues.accountName || ''}
                        error={this.state.formErrors.accountName}
                        onChange={(e) => this.validator.setValue('accountName', e.target.value)}
                        options={this.state.envelopes.map(envelope => ({
                            value: envelope.name
                        }))}
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
            </div>
        </BaseModal>;
    }

    refreshEnvelopes(dataStore: AccountDataStoreClient) {
        dataStore.getUserEnvelopes().then(envelopes => {
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
            
        } else {
            this.setState({
                formErrors: this.validator.errors()
            });
        }
    }
}
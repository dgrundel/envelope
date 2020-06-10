import * as React from "react";
import * as moment from "moment";
import { BankAccountDataStoreClient, BankAccount, getBankAccountTypeLabel } from '@/dataStore/impl/BankAccountDataStore';
import { Modal, BaseModal, ModalApi, ModalButton } from '../Modal';
import { SpinnerModal } from '../SpinnerModal';

import '@public/components/import/ImportWizard.scss';
import { Log } from '@/util/Logger';
import { cpus } from 'os';
import { Wizard, WizardProps, WizardStep, WizardApi } from '../wizard/Wizard';
import { BankAccountTransactionDataStoreClient, BankAccountTransaction } from '@/dataStore/impl/BankAccountTransactionDataStore';
import { stat } from 'fs';
import { dateFormatter, currencyFormatter } from '@/util/Formatters';
import { Currency } from '@/util/Currency';
import { ImportRowSelect } from './ImportRowSelect';

export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];
    firstRow: Row;
    bankAccounts?: BankAccount[];

    bankAccountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];

    transactions?: BankAccountTransaction[];
}

export interface ImportWizardProps {
    modalApi: ModalApi;
    rows: Row[];
}

class NestedWizard extends Wizard<ImportWizardState> { }

const errorMessage = (s: string) => <p className="import-wizard-error-message">{s}</p>;

const convertToTransactions = (rows: Row[], dateColumn: string, amountColumn: string, descriptionColumns: string[], bankAccountId: string): BankAccountTransaction[] => {
    return rows.map(row => {
        const date = moment(row[dateColumn]);
        const year = date.year();
        const month = date.month();
        const day = date.date();
        
        const currency = Currency.parse(row[amountColumn]);
        const wholeAmount = currency.wholeAmount;
        const fractionalAmount = currency.fractionalAmount;

        const description = descriptionColumns
            .map(col => row[col])
            .join(' ');

        return {
            bankAccountId,
            year,
            month,
            day,
            wholeAmount,
            fractionalAmount,
            description,
            originalRecord: row
        };
    });
};

const accountSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.bankAccountId = value;
            api.updateState(state);
        };

        const bankAccounts = state.bankAccounts || [];

        if (bankAccounts.length === 0) {
            Log.debug('No bank accounts to use for import. Should pop a modal here for adding an account.');

            return <p>No banks accounts to use for import. Please add an account first!</p>;
        }

        const bankAccountNames = bankAccounts.reduce((names: Record<string, string>, bankAccount: BankAccount) => {
            const id = bankAccount._id as string;
            names[id] = bankAccount.name;
            
            return names;
        }, {});

        const bankAccountRow = bankAccounts.reduce((row: Row, bankAccount: BankAccount) => {
            const id = bankAccount._id as string;
            row[id] = getBankAccountTypeLabel(bankAccount.type);
            
            return row;
        }, {});

        return <div className="import-wizard-sample-row">
            <h3>Into which <strong>bank account</strong> should we import the transactions?</h3>

            <ImportRowSelect 
                type="radio" 
                rows={[bankAccountRow]} 
                onChange={onChange}
                value={api.getState().bankAccountId}
                keyFormatter={id => bankAccountNames[id]} />
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.bankAccountId,
        message: state.bankAccountId ? null : errorMessage('Please select a bank account.')
    })
};

const dateFieldSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.dateColumn = value;
            api.updateState(state);
        };

        return <div className="import-wizard-sample-row">
            <h3>Which one of these contains the <strong>date</strong> of the transaction?</h3>
            <ImportRowSelect 
                type="radio" 
                rows={state.rows} 
                onChange={onChange}
                columnFilter={(key, value) => moment(value).isValid()}
                value={api.getState().dateColumn}
                keyHeading="CSV Column"
                valueHeading="Sample Value" />
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.dateColumn,
        message: state.dateColumn ? null : errorMessage('Please select one field.')
     })
};

const amountFieldSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const first = state.firstRow;
        const fields = Object.keys(first)
            // only show fields that contain parseable currency
            .filter(key => Currency.parse(first[key]).isValid());

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.amountColumn = value;
            api.updateState(state);
        };

        return <div className="import-wizard-sample-row">
            <h3>Which one of these contains the <strong>amount</strong> of the transaction?</h3>
            <ImportRowSelect 
                type="radio" 
                rows={state.rows} 
                onChange={onChange}
                columnFilter={(key, value) => Currency.parse(value).isValid()}
                value={api.getState().amountColumn}
                keyHeading="CSV Column"
                valueHeading="Sample Value" />
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.amountColumn ,
        message: state.amountColumn ? null : errorMessage('Please select one field.')
    })
};

const descriptionFieldSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const first = state.firstRow;
        const fields = Object.keys(first);
        const initialValue = (state.descriptionColumns || []);

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const checked = e.target.checked;
            const state = api.getState();
            // get existing cols, remove this field
            const selected = (state.descriptionColumns || []).filter(name => name !== value);
            // if checked, add the field to the col list
            state.descriptionColumns = checked ? selected.concat(value) : selected;
            api.updateState(state);
        };

        return <div className="import-wizard-sample-row">
            <h3>Select any items that should be included in the <strong>description</strong> of the transaction.</h3>
            <ImportRowSelect 
                type="checkbox" 
                rows={state.rows} 
                onChange={onChange}
                value={api.getState().descriptionColumns}
                keyHeading="CSV Column"
                valueHeading="Sample Value" />
        </div>;
    },
    validate: (state: ImportWizardState) => {
        const valid = (state.descriptionColumns || []).length > 0;
        return { 
            valid,
            message: valid ? null : errorMessage('Please select at least one field.')
        };
    }
};

const summaryStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState) => {
        const bankAccountId = state.bankAccountId as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;

        const transactions: BankAccountTransaction[] = convertToTransactions(state.rows, dateColumn, amountColumn, descriptionColumns, bankAccountId);

        const accountName = state.bankAccounts?.find(acct => acct._id === state.bankAccountId)?.name;

        return <div className="import-wizard-summary">
            <h3>Ready to import your transactions into <strong>{accountName}</strong>.</h3>

            <table style={{minWidth: '60vw'}}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction, i) => <tr key={`${transaction.description}${i}`}>
                        <td>{dateFormatter(transaction.year, transaction.month, transaction.day)}</td>
                        <td>{transaction.description}</td>
                        <td>{currencyFormatter(transaction.wholeAmount, transaction.fractionalAmount)}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>;
    },
    validate: () => ({ valid: true })
};

export class ImportWizard extends React.Component<ImportWizardProps, ImportWizardState> {
    constructor(props: ImportWizardProps) {
        super(props);

        this.state = {
            rows: this.props.rows,
            firstRow: this.props.rows[0]
        };

        new BankAccountDataStoreClient().getAccounts()
            .then(bankAccounts => {
                this.setState({
                    bankAccounts
                });
            });
    }

    render() {
        if (this.state.bankAccounts) {
            const props = {
                modalApi: this.props.modalApi,
                initialState: {
                    rows: this.props.rows,
                    firstRow: this.props.rows[0],
                    bankAccounts: this.state.bankAccounts
                },
                steps: [
                    accountSelectStep,
                    dateFieldSelectStep,
                    amountFieldSelectStep,
                    descriptionFieldSelectStep,
                    summaryStep
                ],
                onComplete: (wizardState: ImportWizardState) => this.onComplete(wizardState)
            };
    
            return <NestedWizard heading={`Importing ${this.props.rows.length} transaction(s)`} {...props}/>
        }

        return <SpinnerModal/>;
    }

    onComplete(wizardState: ImportWizardState) {
        Log.debug('done', wizardState);

        // bankAccountId: string;
        // date: number;
        // description: string;
        // amount: number;
        // originalRecord: Record<string, string>;
        
        // dismiss import modal
        this.props.modalApi.dismissModal();

        const bankAccountId = wizardState.bankAccountId as string;
        const dateColumn = wizardState.dateColumn as string;
        const descriptionColumns = wizardState.descriptionColumns as string[];
        const amountColumn = wizardState.amountColumn as string;
        
        const transactions = convertToTransactions(this.props.rows, dateColumn, amountColumn, descriptionColumns, bankAccountId);

        // store the data
        new BankAccountTransactionDataStoreClient()
            .addTransactions(transactions)
            .then(value => Log.debug('Saved transactions', value));

        // pop a success modal?
    }
}

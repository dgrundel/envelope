import { Account, AccountDataStoreClient, getAccountTypeLabel } from '@/dataStore/impl/AccountDataStore';
import { Transaction, TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Currency } from '@/util/Currency';
import { currencyFormatter } from '@/util/Formatters';
import { Log } from '@/util/Logger';
import '@public/components/import/ImportWizard.scss';
import * as moment from "moment";
import * as React from "react";
import { ModalApi } from '../Modal';
import { RowSelect } from '../RowSelect';
import { SpinnerModal } from '../SpinnerModal';
import { Wizard, WizardApi, WizardStep } from '../wizard/Wizard';
import { ImportRowSelect } from './ImportRowSelect';


export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];
    firstRow: Row;
    invertTransactions: boolean;
    accounts?: Account[];

    accountName?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];

    transactions?: Transaction[];
}

export interface ImportWizardProps {
    modalApi: ModalApi;
    rows: Row[];
}

class NestedWizard extends Wizard<ImportWizardState> { }

const errorMessage = (s: string) => <p className="import-wizard-error-message">{s}</p>;

const convertToTransactions = (rows: Row[], invert: boolean, dateColumn: string, amountColumn: string, descriptionColumns: string[], accountName: string): Transaction[] => {
    return rows.map(row => {
        const momentDate = moment(row[dateColumn]);
        const date = momentDate.toDate();
        const year = momentDate.year();
        const month = momentDate.month();
        const day = momentDate.date();
        
        const currency = Currency.parse(row[amountColumn]);
        const wholeAmount = (invert ? -1 : 1) * currency.wholeAmount;
        const fractionalAmount = currency.fractionalAmount;

        const description = descriptionColumns
            .map(col => row[col])
            .join(' ');

        return {
            accountName,
            date,
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
            state.accountName = value;
            api.updateState(state);
        };

        const accounts = state.accounts || [];

        if (accounts.length === 0) {
            Log.debug('No accounts to use for import. Should pop a modal here for adding an account.');

            return <p>No accounts to use for import. Please add an account first!</p>;
        }

        const accountRow = accounts.reduce((row: Row, account: Account) => {
            row[account.name] = getAccountTypeLabel(account.type);
            return row;
        }, {});

        return <div className="import-wizard-sample-row">
            <h3>Into which <strong>account</strong> should we import the transactions?</h3>

            <ImportRowSelect 
                type="radio" 
                rows={[accountRow]} 
                onChange={onChange}
                value={api.getState().accountName} />
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.accountName,
        message: state.accountName ? null : errorMessage('Please select an account.')
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

const invertDebitCreditStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const accountName = state.accountName as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;

        const account = state.accounts?.find(acct => acct.name === state.accountName) as Account;
        const transactions: Transaction[] = convertToTransactions(state.rows, false, dateColumn, amountColumn, descriptionColumns, accountName);

        let transaction = transactions.find(transaction => transaction.wholeAmount > 0);
        let hasPositive = !!transaction;
        if (!hasPositive) {
            // if we didn't find a positive transaction, grab a negative one.
            transaction = transactions.find(transaction => transaction.wholeAmount < 0);
        }

        if (!transaction) {
            Log.debug('No non-zero transactions present.', transactions);
            api.nextStep();
            return null;
        }

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.invertTransactions = value === 'true';
            api.updateState(state);
        };

        let expectedDescription;
        let invertedDescription;
        if (hasPositive) {
            if (account.type === 'credit-card') {
                // expect positive transactions on a credit card to be a payment
                expectedDescription = 'payment or credit';
                invertedDescription = 'purchase, fee, or other charge';
            } else {
                // expect positive transactions on checking/savings to be a deposit
                expectedDescription = 'deposit or credit';
                invertedDescription = 'purchase, bill payment, fee, or other type of debit';
            }
        } else {
            // expect negative transactions on credit card/checking/savings to be a purchase or fee
            if (account.type === 'credit-card') {
                expectedDescription = 'purchase, fee, or other charge';
                invertedDescription = 'payment or credit';
            } else {
                expectedDescription = 'purchase, bill payment, fee, or other type of debit';
                invertedDescription = 'deposit or credit';
            }
        }

        return <div>
            <h3>Is this a <strong>{expectedDescription}</strong>?</h3>
            <p>To be sure your transactions are imported correctly, we need to understand
                how positive and negative values should be handled.</p>

            <table className="offset-table">
                <tbody>
                    <tr>
                        <th>Date</th>
                        <td>{transaction.date.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th>Amount</th>
                        <td>{currencyFormatter(transaction.wholeAmount, transaction.fractionalAmount)}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{transaction.description}</td>
                    </tr>
                </tbody>
            </table>

            <RowSelect
                type="radio"
                options={[{
                    value: 'false', // false means we leave amounts as-is.
                    label: <>
                        <strong>Yes</strong>, this is a {expectedDescription}.
                    </>
                },{
                    value: 'true', // true means we need to invert the amounts (positive <=> negative)
                    label: <>
                        <strong>No</strong>, this is a {invertedDescription}.
                    </>
                }]}
                onChange={onChange}
                value={state.invertTransactions.toString()}
            />
        </div>;
    },
    validate: () => ({ valid: true })
};

const summaryStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState) => {
        const accountName = state.accountName as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;
        const invert = state.invertTransactions;

        const transactions: Transaction[] = convertToTransactions(state.rows, invert, dateColumn, amountColumn, descriptionColumns, accountName);

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
                        <td>{transaction.date.toLocaleDateString()}</td>
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
            firstRow: this.props.rows[0],
            invertTransactions: false
        };

        new AccountDataStoreClient().getAccounts()
            .then(accounts => {
                this.setState({
                    accounts
                });
            });
    }

    render() {
        if (this.state.accounts) {
            const props = {
                modalApi: this.props.modalApi,
                initialState: {
                    rows: this.props.rows,
                    firstRow: this.props.rows[0],
                    accounts: this.state.accounts,
                    invertTransactions: false
                },
                steps: [
                    accountSelectStep,
                    dateFieldSelectStep,
                    amountFieldSelectStep,
                    descriptionFieldSelectStep,
                    invertDebitCreditStep,
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

        // accountName: string;
        // date: number;
        // description: string;
        // amount: number;
        // originalRecord: Record<string, string>;
        
        // dismiss import modal
        this.props.modalApi.dismissModal();

        const accountName = wizardState.accountName as string;
        const dateColumn = wizardState.dateColumn as string;
        const descriptionColumns = wizardState.descriptionColumns as string[];
        const amountColumn = wizardState.amountColumn as string;
        const invert = wizardState.invertTransactions;
        
        const transactions = convertToTransactions(this.props.rows, invert, dateColumn, amountColumn, descriptionColumns, accountName);

        // store the data
        new TransactionDataStoreClient()
            .addTransactions(transactions)
            .then(value => Log.debug('Saved transactions', value));

        // pop a success modal?
    }
}

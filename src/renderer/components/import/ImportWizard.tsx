import { Transaction, TransactionData, TransactionType } from '@/models/Transaction';
import { getAppContext } from '@/renderer/AppContext';
import { insertTransactions } from '@/renderer/store/actions/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { filterOnlyBankAccounts, filterOnlyImportedTransactions } from '@/util/Filters';
import { Log } from '@/util/Logger';
import { Account, AccountType, getAccountTypeLabel } from '@models/Account';
import '@public/components/import/ImportWizard.scss';
import * as moment from "moment";
import * as React from "react";
import { connect } from 'react-redux';
import { AppPage } from '../App';
import { SpinnerModal } from '../SpinnerModal';
import { RowSelect } from '../uiElements/RowSelect';
import { Wizard, WizardApi, WizardStep } from '../uiElements/Wizard';
import { ImportRowSelect } from './ImportRowSelect';
import { transactions } from '@/renderer/store/reducers/Transactions';
import { isEqual } from "lodash";


export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];
    firstRow: Row;
    invertTransactions: boolean;
    accounts: Account[];
    accountMap: Record<string, Account>;
    importedTransactions: Transaction[];

    accountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];

    transactions?: Transaction[];
    insertTransactions: (transactionData: TransactionData[]) => Promise<void>;
}

export interface ImportWizardProps {
    rows: Row[];

    // mapped props from store
    accountMap?: Record<string, Account>;
    accounts?: Account[];
    importedTransactions?: Transaction[];

    // store actions
    insertTransactions?: (transactionData: TransactionData[]) => Promise<void>;
}

class NestedWizard extends Wizard<ImportWizardState> { }

const errorMessage = (s: string) => <p className="import-wizard-error-message">{s}</p>;

const convertToTransactions = (rows: Row[], invert: boolean, dateColumn: string, amountColumn: string, descriptionColumns: string[], accountId: string): TransactionData[] => {
    return rows.map(row => {
        const date = new Date(row[dateColumn]);
        const currency = Currency.parse(row[amountColumn]);
        const amount = invert ? currency.getInverse() : currency;
        const description = descriptionColumns
            .map(col => row[col])
            .join(' ');

        return {
            type: TransactionType.Imported,
            accountId,
            date,
            amount,
            description,
            originalRecord: row,
            linkedTransactionIds: []
        };
    });
};

const accountSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.accountId = value;
            api.updateState(state);
        };

        const bankAccounts = state.accounts.filter(filterOnlyBankAccounts);

        if (bankAccounts.length === 0) {
            Log.debug('No accounts to use for import. Should pop a modal here for adding an account.');

            return <p>No accounts to use for import. Please add an account first!</p>;
        }

        const accountRow = bankAccounts.reduce((row: Row, account: Account) => {
            row[account._id] = getAccountTypeLabel(account.type);
            return row;
        }, {});

        return <div className="import-wizard-sample-row">
            <h3>Into which <strong>account</strong> should we import the transactions?</h3>

            <ImportRowSelect 
                type="radio" 
                rows={[accountRow]} 
                onChange={onChange}
                value={api.getState().accountId}
                keyFormatter={id => state.accountMap[id].name} />
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.accountId,
        message: state.accountId ? null : errorMessage('Please select an account.')
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
                columnFilter={(key, value) => !isNaN(Date.parse(value))}
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
        const accountId = state.accountId as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;

        const account = state.accountMap[accountId];
        const transactions: TransactionData[] = convertToTransactions(state.rows, false, dateColumn, amountColumn, descriptionColumns, accountId);

        let transaction = transactions.find(transaction => !transaction.amount.isNegative());
        let hasPositive = !!transaction;
        if (!hasPositive) {
            // if we didn't find a positive transaction, grab a negative one.
            transaction = transactions.find(transaction => transaction.amount.isNegative());
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
            if (account.type === AccountType.CreditCard) {
                // expect positive transactions on a credit card to be a payment
                expectedDescription = 'purchase, fee, or other charge';
                invertedDescription = 'payment or credit';
            } else {
                // expect positive transactions on checking/savings to be a deposit
                expectedDescription = 'deposit or credit';
                invertedDescription = 'purchase, bill payment, fee, or other type of debit';
            }
        } else {
            // expect negative transactions on credit card/checking/savings to be a purchase or fee
            if (account.type === AccountType.CreditCard) {
                expectedDescription = 'payment or credit';
                invertedDescription = 'purchase, fee, or other charge';
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
                        <td>{transaction.amount.toFormattedString()}</td>
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

const identifyDuplicatesStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const accountId = state.accountId as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;
        const invert = state.invertTransactions;

        // const minDate = state.rows.reduce((min: number, row: Row) => {
        //     return Math.min(min, Date.parse(row[dateColumn]));
        // }, Infinity);

        // const maxDate = state.rows.reduce((max: number, row: Row) => {
        //     return Math.max(max, Date.parse(row[dateColumn]));
        // }, -Infinity);

        // filter out transactions from other accounts and outside of this date range
        // const existing = state.importedTransactions.filter(t => {
        //     if (t.accountId !== accountId) {
        //         return false;
        //     }
        //     const millis = t.date.getMilliseconds();
        //     return millis < maxDate && millis > minDate;
        // });

        const duplicates = state.rows.filter(row => {
            return state.importedTransactions.some(t => t.originalRecord && isEqual(t.originalRecord, row));
        });

        console.log(duplicates.length, duplicates);

        // if (duplicates.length === 0) {
        //     api.nextStep();
        // }

        const duplicatesAsTransactions: TransactionData[] = convertToTransactions(duplicates, invert, dateColumn, amountColumn, descriptionColumns, accountId);

        console.log(duplicatesAsTransactions);

        return <div className="import-wizard-summary">
            <h3>Looks like we may have some duplicates.</h3>

            <table style={{minWidth: '60vw'}}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {duplicatesAsTransactions.map((duplicate, i) => <tr key={i}>
                        <td>{duplicate.date.toLocaleDateString()}</td>
                        <td>{duplicate.description}</td>
                        <td>{duplicate.amount.toFormattedString()}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>;
    },
    validate: () => ({ valid: true })
};

const summaryStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState) => {
        const accountId = state.accountId as string;
        const dateColumn = state.dateColumn as string;
        const descriptionColumns = state.descriptionColumns as string[];
        const amountColumn = state.amountColumn as string;
        const invert = state.invertTransactions;

        const account = state.accountMap[accountId];
        const transactions: TransactionData[] = convertToTransactions(state.rows, invert, dateColumn, amountColumn, descriptionColumns, accountId);

        return <div className="import-wizard-summary">
            <h3>Ready to import your transactions into <strong>{account.name}</strong>.</h3>

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
                        <td>{transaction.amount.toFormattedString()}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>;
    },
    validate: () => ({ valid: true })
};

class Component extends React.Component<ImportWizardProps, ImportWizardState> {
    constructor(props: ImportWizardProps) {
        super(props);

        this.state = {
            rows: this.props.rows,
            firstRow: this.props.rows[0],
            invertTransactions: false,
            accounts: props.accounts!,
            accountMap: props.accountMap!,
            importedTransactions: props.importedTransactions!,
            insertTransactions: props.insertTransactions!,
        };
    }

    render() {
        if (this.state.accounts) {
            const props = {
                initialState: {
                    rows: this.props.rows,
                    firstRow: this.props.rows[0],
                    accounts: this.state.accounts,
                    accountMap: this.state.accountMap,
                    importedTransactions: this.state.importedTransactions,
                    invertTransactions: false,
                    insertTransactions: this.state.insertTransactions
                },
                steps: [
                    accountSelectStep,
                    dateFieldSelectStep,
                    amountFieldSelectStep,
                    descriptionFieldSelectStep,
                    invertDebitCreditStep,
                    identifyDuplicatesStep,
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

        const accountId = wizardState.accountId as string;
        const dateColumn = wizardState.dateColumn as string;
        const descriptionColumns = wizardState.descriptionColumns as string[];
        const amountColumn = wizardState.amountColumn as string;
        const invert = wizardState.invertTransactions;
        
        const transactions = convertToTransactions(this.props.rows, invert, dateColumn, amountColumn, descriptionColumns, accountId);

        wizardState.insertTransactions(transactions).then(() => {
            const appContext = getAppContext();
            // dismiss import modal
            appContext.modalApi.dismissModal();
            appContext.pageApi.setPage(AppPage.Transactions);
        });
    }
}

const mapStateToProps = (state: CombinedState, ownProps: ImportWizardProps): ImportWizardProps => ({
    ...ownProps,
    accounts: state.accounts.sortedIds.map(id => state.accounts.accounts[id]),
    accountMap: state.accounts.accounts,
    importedTransactions: state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(filterOnlyImportedTransactions)
});

export const ImportWizard = connect(mapStateToProps, { insertTransactions })(Component);
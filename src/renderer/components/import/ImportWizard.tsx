import * as React from "react";
import { BankAccountDataStoreClient, BankAccount, getBankAccountTypeLabel } from '@/dataStore/impl/BankAccountDataStore';
import { Modal, BaseModal, ModalApi, ModalButton } from '../Modal';
import { SpinnerModal } from '../SpinnerModal';

import '@public/components/import/ImportWizard.scss';
import { Log } from '@/util/Logger';
import { cpus } from 'os';
import { Wizard, WizardProps, WizardStep, WizardApi } from '../wizard/Wizard';

export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    firstRow: Row;
    bankAccounts?: BankAccount[];

    bankAccountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
}

export interface ImportWizardProps {
    modalApi: ModalApi;
    rows: Row[];
}

class NestedWizard extends Wizard<ImportWizardState> { }

const errorMessage = (s: string) => <p className="import-wizard-error-message">{s}</p>;

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

        return <div className="import-wizard-sample-row">
            <h3>Into which <strong>bank account</strong> should we import the transactions?</h3>

            {bankAccounts.map(bankAccount => <label key={bankAccount._id}>
                <input 
                    type="radio"
                    name="field-select" 
                    value={bankAccount._id}
                    checked={bankAccount._id === api.getState().bankAccountId}
                    onChange={onChange}/>
                <span>{bankAccount.name}</span>
                <span>{getBankAccountTypeLabel(bankAccount.type)}</span>
            </label>)}
        </div>;
    },
    validate: (state: ImportWizardState) => ({ 
        valid: !!state.bankAccountId,
        message: state.bankAccountId ? null : errorMessage('Please select a bank account.')
    })
};

const dateFieldSelectStep: WizardStep<ImportWizardState> = {
    render: (state: ImportWizardState, api: WizardApi<ImportWizardState>) => {
        const first = state.firstRow;
        const fields = Object.keys(first);

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.dateColumn = value;
            api.updateState(state);
        };

        return <div className="import-wizard-sample-row">
            <h3>Which one of these contains the <strong>date</strong> of the transaction?</h3>

            {fields.map(key => <label key={key}>
                <input 
                    type="radio"
                    name="field-select" 
                    value={key}
                    checked={key === api.getState().dateColumn}
                    onChange={onChange}/>
                <span>{key}</span>
                <span>{first[key]}</span>
            </label>)}
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
            // only show fields that contain parseable numbers
            .filter(key => !isNaN(parseFloat(first[key])));

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.amountColumn = value;
            api.updateState(state);
        };

        return <div className="import-wizard-sample-row">
            <h3>Which one of these contains the <strong>amount</strong> of the transaction?</h3>

            {fields.map(key => <label key={key}>
                <input 
                    type="radio"
                    name="field-select" 
                    value={key}
                    checked={key === api.getState().amountColumn}
                    onChange={onChange}/>
                <span>{key}</span>
                <span>{first[key]}</span>
            </label>)}
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

            {fields.map(key => <label key={key}>
                <input 
                    type="checkbox"
                    name="field-select" 
                    value={key}
                    checked={initialValue.findIndex(s => s === key) !== -1}
                    onChange={onChange}/>
                <span>{key}</span>
                <span>{first[key]}</span>
            </label>)}
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
        return <div className="import-wizard-summary">
            <h3>Everything look good?</h3>
            <table>
                <tbody>
                    <tr>
                        <th>Bank Account</th>
                        <td>{state.bankAccounts?.find(acct => acct._id === state.bankAccountId)?.name}</td>
                    </tr>
                    <tr>
                        <th>Date</th>
                        <td>{state.dateColumn}</td>
                    </tr>
                    <tr>
                        <th>Amount</th>
                        <td>{state.amountColumn}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{(state.descriptionColumns || []).join(',')}</td>
                    </tr>
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
                onComplete: (wizardState: ImportWizardState) => {
                    Log.debug('done', wizardState);
                }
            };
    
            return <NestedWizard heading={`Importing ${this.props.rows.length} transaction(s)`} {...props}/>
        }

        return <SpinnerModal/>;
    }
}
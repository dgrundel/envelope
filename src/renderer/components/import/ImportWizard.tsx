import * as React from "react";
import { BankAccountDataStoreClient, BankAccount, getBankAccountTypeLabel } from '@/dataStore/impl/BankAccountDataStore';
import { Modal, BaseModal, ModalApi, ModalButton } from '../Modal';
import { SpinnerModal } from '../SpinnerModal';

import '@public/components/import/ImportWizard.scss';
import { Log } from '@/util/Logger';
import { cpus } from 'os';

export interface Row {
    [header: string]: string;
}

export interface ImportWizardProps {
    modalApi: ModalApi;
    rows: Row[];
}

export interface ImportWizardState {
    step: number;
    firstRow: Row;
    bankAccounts?: BankAccount[];

    bankAccountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
}

export class ImportWizard extends React.Component<ImportWizardProps, ImportWizardState> implements Modal {

    constructor(props: ImportWizardProps) {
        super(props);

        this.state = {
            step: 0,
            firstRow: this.props.rows[0]
        };

        new BankAccountDataStoreClient().getAccounts()
            .then(bankAccounts => this.setState({
                bankAccounts
            }));
    }

    render() {
        if (!this.state.bankAccounts) {
            return <SpinnerModal/>;
        }

        const buttons: ModalButton[] = [
            {
                buttonText: 'Back',
                onClick: () => {
                    this.setState(prev => ({
                        step: prev.step - 1
                    }));
                }
            },{
                buttonText: 'Next',
                onClick: () => {
                    this.setState(prev => ({
                        step: prev.step + 1
                    }));
                }
            }
        ];

        // bankAccountId?: string;
        // dateColumn?: string;
        // amountColumn?: string;
        // descriptionColumns?: string[];
        
        /**
         * TODO
         * - need to preserve/reset inputs when paging between steps, possibly get this for free if these are broken into components
         * - pre-validate columns for selection (e.g. attempt to parse fields for things that should be numbers, dates)
         * - ensure step counter doesn't go out of bounds
         * - validate selections
         */
        
        const steps = [
            () => this.renderBankAccountAssocPanel((e: React.ChangeEvent<HTMLInputElement>) => {
                const selected = e.target.value;
                this.setState({
                    bankAccountId: selected
                });
            }),
            () => this.renderColumnAssocPanel('date', k => !!k, (e: React.ChangeEvent<HTMLInputElement>) => {
                const selected = e.target.value;
                this.setState({
                    dateColumn: selected
                });
            }),
            () => this.renderColumnAssocPanel('amount', (k, v) => !isNaN(parseFloat(v)), (e: React.ChangeEvent<HTMLInputElement>) => {
                const selected = e.target.value;
                this.setState({
                    amountColumn: selected
                });
            }),
            () => this.renderDescriptionAssocPanel((e: React.ChangeEvent<HTMLInputElement>) => {
                // get existing cols, remove this field
                const cols = (this.state.descriptionColumns || []).filter(s => s !== e.target.value);
                // if checked, add the field to the col list
                this.setState({
                    descriptionColumns: e.target.checked ? cols.concat(e.target.value) : cols
                });
            }),
            () => this.renderSummaryPanel()
        ];

        const stepFn = steps[this.state.step];

        return <BaseModal heading={`Importing ${this.props.rows.length} Transaction(s)`} buttons={buttons} closeButtonHandler={this.props.modalApi.dismissModal}>
            <div className="import-wizard">
                {stepFn()}
            </div>
        </BaseModal>;
    }

    renderBankAccountAssocPanel(onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) {
        const bankAccounts = this.state.bankAccounts || [];

        if (bankAccounts.length === 0) {
            Log.debug('No bank accounts to use for import. Should pop a modal here for adding an account.');

            return <p>No banks accounts to use for import. Please add an account first!</p>;
        }

        return <>
            <h3>Into which <strong>bank account</strong> should we import the transactions?</h3>

            <div className="import-wizard-sample-row">
                {bankAccounts.map(bankAccount => <label key={bankAccount._id}>
                    <input 
                        type="radio"
                        name="field-select" 
                        value={bankAccount._id}
                        onChange={onChange}/>
                    <span>{bankAccount.name}</span>
                    <span>{getBankAccountTypeLabel(bankAccount.type)}</span>
                </label>)}
            </div>
        </>;
    }

    renderColumnAssocPanel(fieldLabel: string, filter: (k: string, v: string) => boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) {
        const first = this.state.firstRow;
        return <>
            <h3>Which one of these contains the <strong>{fieldLabel}</strong> of the transaction?</h3>

            <div className="import-wizard-sample-row">
                {Object.keys(first)
                    .filter(key => filter(key, first[key]))
                    .map(key => <label key={key}>
                        <input 
                            type="radio"
                            name="field-select" 
                            value={key}
                            onChange={onChange}/>
                        <span>{key}</span>
                        <span>{first[key]}</span>
                    </label>)}
            </div>
        </>;
    }

    renderDescriptionAssocPanel(onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) {
        const first = this.state.firstRow;
        return <>
            <h3>Select any items that should be included in the <strong>description</strong> of the transaction.</h3>
            
            <div className="import-wizard-sample-row">
                {Object.keys(first).map(key => <label key={key}>
                    <input 
                        type="checkbox"
                        name={key}
                        onChange={onChange}/>
                    <span>{key}</span>
                    <span>{first[key]}</span>
                </label>)}
            </div>
        </>;
    }

    renderSummaryPanel() {
        const first = this.state.firstRow;
        return <>
            <h3>Everything look good?</h3>
            
            <table>
                <tbody>
                    <tr>
                        <th>Bank Account</th>
                        <td>{this.state.bankAccountId}</td>
                    </tr>
                    <tr>
                        <th>Date</th>
                        <td>{this.state.dateColumn}</td>
                    </tr>
                    <tr>
                        <th>Amount</th>
                        <td>{this.state.amountColumn}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{(this.state.descriptionColumns || []).join(',')}</td>
                    </tr>
                </tbody>
            </table>
        </>;
    }
}
import * as React from "react";
import { Modal, BaseModal, ModalApi, ButtonSets } from "../Modal";
import '@public/components/import/ImportFieldAssociate.scss';
import { FormField, FormFieldValues, Form } from "../Form";
import { BankAccount, BankAccountDataStoreClient } from "@/dataStore/impl/BankAccountDataStore";
import { Log } from "@/util/Logger";
import { SpinnerModal } from "../SpinnerModal";

export interface Row {
    [header: string]: string;
}

export interface ImportFieldAssociateProps {
    modalApi: ModalApi
    rows: Row[]
}

export interface ImportFieldAssociateState {
    bankAccounts?: BankAccount[]
}

export class ImportFieldAssociate extends React.Component<ImportFieldAssociateProps, ImportFieldAssociateState> implements Modal {
    
    constructor(props: ImportFieldAssociateProps) {
        super(props);

        this.state = {};

        new BankAccountDataStoreClient().getAccounts()
            .then(bankAccounts => this.setState({
                bankAccounts
            }));
    }

    render() {
        if (!this.state.bankAccounts) {
            return <SpinnerModal/>;
        }

        const rows = this.props.rows;
        const first = rows[0];

        const fieldOptions = Object.keys(first).map(name => ({
            label: name,
            value: name
        }));

        const formFields: FormField[] = [{
            name: 'bankAccountId',
            label: 'Import into account',
            type: 'select',
            options: this.state.bankAccounts.map(bankAccount => ({
                label: bankAccount.name,
                value: bankAccount._id
            }))
        },{
            name: 'date',
            label: 'Date field',
            type: 'select',
            options: fieldOptions
        },{
            name: 'amount',
            label: 'Amount field',
            type: 'select',
            options: fieldOptions
        },{
            name: 'description',
            label: 'Description field',
            type: 'select',
            options: fieldOptions
        }];

        const onSubmit = (values: FormFieldValues) => {
            // const bankAcct = (values as BankAccount);
            // const client = new BankAccountDataStoreClient();
            // client.addAccount(bankAcct).then(res => Log.debug(res));
        };

        const validator = (values: FormFieldValues) => {
            // const bankAcct = (values as BankAccount);
            // const client = new BankAccountDataStoreClient();
            // client.addAccount(bankAcct).then(res => Log.debug(res));
            return ['amount', 'date'];
        };

        return <BaseModal heading={`Importing ${rows.length} Transaction(s)`} closeButtonHandler={this.props.modalApi.dismissModal}>
            <div className="import-field-associate-modal">
                <div>
                    <table>
                        <tbody>
                            {Object.keys(first).map(key => <tr key={key}>
                                <th>{key}</th>
                                <td>{first[key]}</td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
                <div>
                    <Form fields={formFields} validator={validator} onSubmit={onSubmit} submitLabel="Next"/>
                </div>
            </div>
        </BaseModal>;
    }
}
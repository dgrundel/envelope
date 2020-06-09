import * as React from "react";
import { Box } from "./Box";

import '@public/components/App.scss';
import { ImportDropTarget } from "./import/ImportDropTarget";
import { ModalApi, Modal, BaseModal, ButtonSets } from "./Modal";
import { AccountList } from "./AccountList";
import { Form, FormField, FormFieldValues } from "./Form";
import { BankAccount, BankAccountDataStoreClient } from "@/dataStore/impl/BankAccountDataStore";
import { Log } from "@/util/Logger";

export interface AppProps {
}

export interface AppState {
    modals: Modal[];
}

export class App extends React.Component<AppProps, AppState> implements ModalApi {

    constructor(props: AppProps) {
        super(props);

        this.state = {
            modals: []
        };

        this.dismissModal = this.dismissModal.bind(this);
        this.queueModal = this.queueModal.bind(this);

        // setTimeout(() => {
        //     const sampleModal = <BaseModal heading="Test modal" buttons={ButtonSets.ok(this)} closeButtonHandler={this.dismissModal}>Hello, modal.</BaseModal>;
        //     this.queueModal(sampleModal);
        // }, 2000);
    }

    render() {
        const formFields: Record<string, FormField> = {
            name: {
                label: 'Account Name',
                type: 'text',
                required: true
            },
            type: {
                label: 'Account Type',
                type: 'select',
                options: [
                    { label: 'Checking Account', value: 'checking'},
                    { label: 'Savings Account', value: 'savings'},
                    { label: 'Credit Card', value: 'credit-card'}
                ]
            }
        };

        const onSubmit = (values: FormFieldValues) => {
            const bankAcct = (values as BankAccount);
            const client = new BankAccountDataStoreClient();
            client.addAccount(bankAcct).then(res => Log.debug(res));
        };

        return <div id="app">
            <div id="header">
                <h1>Envelope</h1>
            </div>
            <div id="sidebar">
                <ImportDropTarget modalApi={this}/>
            </div>
            <div id="main">
                <Box>
                    <h1>Hello, world!</h1>
                </Box>
                <AccountList/>
                <Box>
                    <Form
                        fields={formFields}
                        onSubmit={onSubmit}
                        submitLabel="Save"
                    />
                </Box>
                {this.showModal()}
            </div>
        </div>;
    }

    queueModal(modal: Modal) {
        this.setState(prev => {
            return {
                modals: prev.modals.concat(modal)
            }
        });
    }

    showModal() {
        if (this.state.modals.length) {
            return this.state.modals[0];
        }
        return null;
    }

    dismissModal() {
        this.setState(prev => {
            return {
                modals: prev.modals.slice(1)
            }
        });
    }
}
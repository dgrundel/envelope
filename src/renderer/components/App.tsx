import * as React from "react";
import { Box } from "./Box";

import '@public/components/App.scss';
import { ImportDropTarget } from "./ImportDropTarget";
import { Modal, ModalProps, ModalApi } from "./Modal";
import { AccountList } from "./AccountList";
import { Form, FormField, FormFieldValues } from "./Form";
import { BankAccount, BankAccountDataStoreClient } from "@/dataStore/impl/BankAccountDataStore";

export interface AppProps {
}

export interface AppState {
    modals: any[];
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
        //     const sampleModal = <Modal heading="Test modal" buttons={{ 'Close': this.dismissModal }} close={this.dismissModal}>Hello, modal.</Modal>;
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
            client.addAccount(bankAcct).then(res => console.log(res));
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

    queueModal(modal: any) {
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
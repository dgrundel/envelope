import * as React from "react";
import { Box } from "./Box";
import { Header } from "./Header";

import '@public/components/App.scss';
import { Import } from "./Import";
import { Modal, ModalProps } from "./Modal";
import { AccountList } from "./AccountList";
import { Form, FormField, FormFieldValues } from "./Form";
import { BankAccount, BankAccountDataStoreClient } from "@/dataStore/impl/BankAccountDataStore";

export interface AppProps {
}

export interface AppState {
    modal?: any;
}

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);

        this.dismissModal = this.dismissModal.bind(this);

        this.state = {
            modal: <Modal heading="Test modal" 
                buttons={{ 'Close': this.dismissModal }}
                close={this.dismissModal}>Hello, modal.</Modal>
        };
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
            <Header/>
            <div id="sidebar"></div>
            <div id="main">
                <Box>
                    <h1>Hello, world!</h1>
                </Box>
                <Import/>
                <AccountList/>
                <Box>
                    <Form
                        fields={formFields}
                        onSubmit={onSubmit}
                        submitLabel="Save"
                    />
                </Box>
                {this.state.modal || ''}
            </div>
        </div>;
    }

    dismissModal() {
        this.setState({ modal: undefined });
    }
}
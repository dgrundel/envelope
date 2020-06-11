import * as React from "react";
import { Box } from "./Box";

import '@public/components/App.scss';

import { ImportDropTarget } from "./import/ImportDropTarget";
import { ModalApi, Modal, BaseModal, ButtonSets } from "./Modal";
import { AccountList } from "./AccountList";
import { Form, FormField, FormFieldValues } from "./Form";
import { Account, AccountDataStoreClient, AccountType, getAccountTypeLabel, getUserAccountTypes } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import { TransactionList } from './TransactionList';

const envelopeIcon = require('@public/images/envelope-icon.svg');

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
        const formFields: FormField[] = [{
            name: 'name',
            label: 'Account Name',
            type: 'text',
            required: true
        },
        {
            name: 'type',
            label: 'Account Type',
            type: 'select',
            options: getUserAccountTypes().map(accountType => ({
                label: getAccountTypeLabel(accountType),
                value: accountType
            }))
        }];

        const onSubmit = (values: FormFieldValues) => {
            const account = (values as Account);
            const client = new AccountDataStoreClient();
            client.addAccount(account).then(res => Log.debug(res));
        };

        return <div id="app">
            <div id="header">
                <span className="envelope-icon" dangerouslySetInnerHTML={({__html: envelopeIcon})} />
                <h1 className="header-text">Envelope</h1>
            </div>
            <div id="sidebar">
                <h4 className="sidebar-nav-header">Navigation Header</h4>
                <ul className="sidebar-nav">
                    <li>Accounts</li>
                    <li>Envelopes</li>
                    <li>Transactions</li>
                </ul>
                <ImportDropTarget modalApi={this}/>
            </div>
            <div id="main">
                <AccountList/>
                <Box>
                    <Form
                        fields={formFields}
                        onSubmit={onSubmit}
                        submitLabel="Save"
                    />
                </Box>
                <TransactionList/>
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
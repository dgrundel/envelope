import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { Account, AccountDataStoreClient, AccountType, getAccountTypeLabel, getUserAccountTypes } from '@/dataStore/impl/AccountDataStore';
import { Log } from '@/util/Logger';
import * as React from "react";
import { Box } from "../Box";
import { Form, FormField, FormFieldValues } from '../Form';
import { EventListener } from '../EventListener';

// import '@public/components/AccountsPage.scss';

export interface AccountsPageProps {
}

export interface AccountsPageState {
    accounts: Account[];
    dataStore: AccountDataStoreClient;
    newAccountName?: string;
    newAccountType?: AccountType;
}

export class AccountsPage extends EventListener<AccountsPageProps, AccountsPageState> {

    constructor(props: AccountsPageProps) {
        super(props);

        const dataStore = new AccountDataStoreClient();
        
        this.state = {
            accounts: [],
            dataStore
        };

        this.refreshAccounts(dataStore);
  
        this.addListener(() => dataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshAccounts(dataStore);
            }
        }));
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
            client.addAccount(account).then(created => Log.debug(created));
        };


        return <>
            <Box heading="Accounts">
                {this.renderList()}
            </Box>
            <Box>
                <Form
                    fields={formFields}
                    onSubmit={onSubmit}
                    submitLabel="Save"
                />
            </Box>
        </>;
    }

    refreshAccounts(dataStore: AccountDataStoreClient) {
        dataStore.getUserAccounts().then(accounts => {
            this.setState({
                accounts: accounts
            });
        });
    }

    renderList() {
        if (this.state.accounts.length > 0) {
            return <table>
                <tbody>
                    {this.state.accounts.map(account => <tr key={account._id}>
                        <td>{account.name}</td>
                        <td>{getAccountTypeLabel(account.type)}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }
}
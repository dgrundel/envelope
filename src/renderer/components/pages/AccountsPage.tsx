import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { Account, AccountDataStoreClient, AccountType, getAccountTypeLabel, getUserAccountTypes } from '@/dataStore/impl/AccountDataStore';
import { Log } from '@/util/Logger';
import * as React from "react";
import { Box } from "../Box";
import { Form, FormField, FormFieldValues } from '../Form';
import { EventListener } from '../EventListener';
import { Currency } from '@/util/Currency';

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
        },{
            name: 'balance',
            label: 'Current Balance',
            type: 'text',
            required: true
        }];

        const onSubmit = (values: FormFieldValues) => {
            const balance = Currency.parse(values.balance);
            const account: Account = {
                name: values.name,
                type: values.type,
                balanceWholeAmount: balance.isValid() ? balance.wholeAmount : 0,
                balancefractionalAmount: balance.isValid() ? balance.fractionalAmount : 0
            };
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
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.accounts.map(account => <tr key={account._id}>
                        <td>{account.name}</td>
                        <td>{getAccountTypeLabel(account.type)}</td>
                        <td>{new Currency(account.balanceWholeAmount, account.balancefractionalAmount).toFormattedString()}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }
}
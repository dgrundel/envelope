import { Account, AccountDataStoreClient, AccountType, getAccountTypeLabel } from '@/dataStore/impl/AccountDataStore';
import { Currency } from '@/util/Currency';
import * as React from "react";
import { AccountCreate } from '../AccountCreate';
import { Box } from "../Box";
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
            this.refreshAccounts(dataStore);
        }));
    }

    render() {
        return <>
            <Box heading="Accounts">
                {this.renderList()}
            </Box>
            <Box>
                <AccountCreate/>
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
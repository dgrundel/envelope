import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { Account, AccountDataStoreClient, AccountType, getAccountTypeLabel } from '@/dataStore/impl/AccountDataStore';
import * as React from "react";
import { Box } from "./Box";

// import '@public/components/AccountList.scss';

export interface AccountListProps {
}

export interface AccountListState {
    accounts: Account[];
    dataStore: AccountDataStoreClient;
    newAccountName?: string;
    newAccountType?: AccountType;
}

export class AccountList extends React.Component<AccountListProps, AccountListState> {

    constructor(props: AccountListProps) {
        super(props);

        const dataStore = new AccountDataStoreClient();
        
        this.state = {
            accounts: [],
            dataStore
        };

        this.refreshAccounts(dataStore);
  
        dataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshAccounts(dataStore);
            }
        });
    }

    render() {
        return <Box heading="Accounts">
            {this.renderList()}
        </Box>;
    }

    refreshAccounts(dataStore: AccountDataStoreClient) {
        dataStore.getAccounts().then(accounts => {
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
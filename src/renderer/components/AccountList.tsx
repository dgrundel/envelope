import { remote } from 'electron';
import * as React from "react";
import { Box } from "./Box";
import { BankAccount, BankAccountType, BankAccountDataStoreClient } from '@/dataStore/impl/BankAccountDataStore';

// import '@public/components/AccountList.scss';

export interface AccountListProps {
}

export interface AccountListState {
    bankAccounts: BankAccount[];
    dataStore: BankAccountDataStoreClient;
    newAccountName?: string;
    newAccountType?: BankAccountType;
}

export class AccountList extends React.Component<AccountListProps, AccountListState> {

    constructor(props: AccountListProps) {
        super(props);

        const dataStore = new BankAccountDataStoreClient();
        
        this.state = {
            bankAccounts: [],
            dataStore
        };

        dataStore.getAccounts().then(accounts => {
            this.setState({
                bankAccounts: accounts
            });
        });
  
    }

    render() {
        return <Box heading="Accounts">
            {this.renderList()}
        </Box>;
    }

    renderList() {
        if (this.state.bankAccounts.length > 0) {
            return <table>
                <tbody>
                    {this.state.bankAccounts.map(bankAccount => <tr>
                        <td>{bankAccount.name}</td>
                        <td>{bankAccount.type}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }
}
import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { BankAccount, BankAccountDataStoreClient, BankAccountType, getBankAccountTypeLabel } from '@/dataStore/impl/BankAccountDataStore';
import * as React from "react";
import { Box } from "./Box";

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

        this.refreshBankAccounts(dataStore);
  
        dataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshBankAccounts(dataStore);
            }
        });
    }

    render() {
        return <Box heading="Accounts">
            {this.renderList()}
        </Box>;
    }

    refreshBankAccounts(dataStore: BankAccountDataStoreClient) {
        dataStore.getAccounts().then(accounts => {
            this.setState({
                bankAccounts: accounts
            });
        });
    }

    renderList() {
        if (this.state.bankAccounts.length > 0) {
            return <table>
                <tbody>
                    {this.state.bankAccounts.map(bankAccount => <tr key={bankAccount._id}>
                        <td>{bankAccount.name}</td>
                        <td>{getBankAccountTypeLabel(bankAccount.type)}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }
}
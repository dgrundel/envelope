import * as React from "react";
import { BankAccount, bankAccounts } from "@/main/dataStores/BankAccounts";
import { Box } from "./Box";

// import '@public/components/AccountList.scss';

export interface AccountListProps {
}

export interface AccountListState {
    bankAccounts: BankAccount[];
}

export class AccountList extends React.Component<AccountListProps, AccountListState> {

    constructor(props: AccountListProps) {
        super(props);

        this.state = {
            bankAccounts: []
        };
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
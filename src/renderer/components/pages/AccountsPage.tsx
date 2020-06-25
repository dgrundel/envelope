import { Account, AccountType, getAccountTypeLabel, getBankAccountTypes } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { AccountCreate } from '../AccountCreate';
import { Box } from "../Box";
import { AccountState } from '@/renderer/store/reducers/Accounts';
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyBankAccounts } from '@/util/Filters';

// import '@public/components/AccountsPage.scss';

export interface AccountsPageProps {
    accounts?: Account[];
}

export interface AccountsPageState {
    newAccountName?: string;
    newAccountType?: AccountType;
}

class Component extends React.Component<AccountsPageProps, AccountsPageState> {

    constructor(props: AccountsPageProps) {
        super(props);

        this.state = {};
    }

    render() {
        return <>
            <Box heading="Accounts">
                {this.renderList()}
            </Box>
            <Box heading="Add an Account">
                <AccountCreate/>
            </Box>
        </>;
    }

    renderList() {
        const accounts = this.props.accounts || [];
        if (accounts.length > 0) {
            return <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => <tr key={account._id}>
                        <td>{account.name}</td>
                        <td>{getAccountTypeLabel(account.type)}</td>
                        <td>{account.balance.toFormattedString()}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AccountsPageProps): AccountsPageProps => ({
    ...ownProps,
    accounts: state.accounts.sortedIds.map(id => state.accounts.accounts[id]).filter(filterOnlyBankAccounts)
})

export const AccountsPage = connect(mapStateToProps, {})(Component);
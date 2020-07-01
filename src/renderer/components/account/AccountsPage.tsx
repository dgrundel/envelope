import { Account, AccountType, getAccountTypeLabel, getBankAccountTypes } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { AccountCreate } from './AccountCreate';
import { Box } from "../uiElements/Box";
import { AccountState } from '@/renderer/store/reducers/Accounts';
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyBankAccounts } from '@/util/Filters';
import { IconButton, mergeStyles } from '@fluentui/react';
import { getAppContext } from '@/renderer/AppContext';
import { BaseModal } from '../uiElements/Modal';
import { AdjustBalance } from '../transaction/AdjustBalance';

// import '@public/components/AccountsPage.scss';

export interface AccountsPageProps {
    accounts?: Account[];
}

export interface AccountsPageState {
    newAccountName?: string;
    newAccountType?: AccountType;
}

const actionCellStyle = mergeStyles({
    textAlign: 'right',
    padding: '0',
});

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
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => <tr key={account._id}>
                        <td>{account.name}</td>
                        <td>{getAccountTypeLabel(account.type)}</td>
                        <td>{account.balance.toFormattedString()}</td>
                        <td className={actionCellStyle}>
                            <IconButton iconProps={({ iconName: 'Edit' })} title="Adjust Balance" onClick={() => this.showAdjustBalanceModal(account)} />
                        </td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No accounts yet!';
    }

    showAdjustBalanceModal(account: Account) {
        const dismiss = () => {
            getAppContext().modalApi.dismissModal();
        };

        const modal = <BaseModal heading={`Adjust balance of ${account.name}`} closeButtonHandler={dismiss}>
            <AdjustBalance account={account} onComplete={dismiss}/>
        </BaseModal>;

        getAppContext().modalApi.queueModal(modal);
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AccountsPageProps): AccountsPageProps => ({
    ...ownProps,
    accounts: state.accounts.sortedIds.map(id => state.accounts.accounts[id]).filter(filterOnlyBankAccounts)
})

export const AccountsPage = connect(mapStateToProps, {})(Component);
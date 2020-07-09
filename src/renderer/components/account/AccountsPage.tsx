import { CombinedState } from '@/renderer/store/store';
import { filterOnlyBankAccounts } from '@/util/Filters';
import { IconButton, mergeStyles } from '@fluentui/react';
import { Account, AccountType, getAccountTypeLabel } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { AdjustBalance } from '../transaction/AdjustBalance';
import { Box } from "../uiElements/Box";
import { BaseModal } from '../uiElements/Modal';
import { AccountCreate } from './AccountCreate';
import { setModal, dismissModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';

export interface AccountsPageProps {
    // mapped from state
    accounts?: Account[];

    // store actions
    setModal?: (modal: Modal) => void;
    dismissModal?: () => void;
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
        const setModal = this.props.setModal!;
        const dismissModal = this.props.dismissModal!;

        const modal = <BaseModal heading={`Adjust balance of ${account.name}`} closeButtonHandler={dismissModal}>
            <AdjustBalance account={account} onComplete={dismissModal}/>
        </BaseModal>;

        setModal(modal);
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AccountsPageProps): AccountsPageProps => ({
    ...ownProps,
    accounts: state.accounts.sortedIds.map(id => state.accounts.accounts[id]).filter(filterOnlyBankAccounts)
})

const storeActions = {
    setModal,
    dismissModal,
};

export const AccountsPage = connect(mapStateToProps, storeActions)(Component);
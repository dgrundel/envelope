import { dismissModal, setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyBankAccounts } from '@/util/Filters';
import { IconButton, mergeStyles, Text, FontIcon } from '@fluentui/react';
import { Account, AccountType, getAccountTypeLabel, getAccountTypeIcon } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { AdjustBalance } from '../transaction/AdjustBalance';
import { Card } from '../uiElements/Card';
import { BaseModal } from '../uiElements/Modal';
import { AccountCreate } from './AccountCreate';
import { Layout } from '../uiElements/Layout';
import { Currency } from '@/models/Currency';

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

class Component extends React.Component<AccountsPageProps, AccountsPageState> {

    constructor(props: AccountsPageProps) {
        super(props);

        this.state = {};
    }

    render() {
        return <>
            <Layout>
                <Card heading="Add an Account">
                    <AccountCreate/>
                </Card>
            </Layout>

            <Layout split={2}>
                {this.props.accounts!.map(account => this.renderAccountCard(account))}
            </Layout>
        </>;
    }

    renderAccountCard(account: Account) {
        const typeLabel = getAccountTypeLabel(account.type);
        const heading = <>
            <FontIcon iconName={getAccountTypeIcon(account.type)} title={typeLabel} style={{ float: 'right' }} />
            {account.name}
        </>;

        return <Card key={account._id} heading={heading}>
            <p>
                <Text variant={'xxLarge'}>{account.balance.toFormattedString()}</Text>
            </p>
            <div style={{ float: 'right' }}>
                <IconButton iconProps={({ iconName: 'Edit' })} title="Adjust Balance" onClick={() => this.showAdjustBalanceModal(account)} />
            </div>
            <p>
                <Text variant={'smallPlus'}>{typeLabel}</Text>
            </p>
        </Card>
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
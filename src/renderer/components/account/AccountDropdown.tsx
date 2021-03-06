import { Account, AccountType, getAccountTypeIcon, getAccountTypeLabel } from '@/models/Account';
import { Dropdown, DropdownMenuItemType, Icon, IDropdownOption, mergeStyles, Text } from '@fluentui/react';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../../store/store';
import { Currency } from '@/models/Currency';

type GroupedAccounts = Record<AccountType, Account[]>;

export interface AccountDropdownProps {
    onChange: (e: React.FormEvent<HTMLDivElement>, selected?: IDropdownOption) => void;
    onRenderEmptyList?: () => any;
    label?: string;
    placeholder?: string;
    selectedKey?: string | number | string[] | number[];
    filter?: (account: Account) => boolean;
    showBalance?: boolean;

    // mapped from store
    groupedAccounts?: GroupedAccounts;
}

const iconStyle = mergeStyles({
    verticalAlign: 'middle',
    marginRight: '1ex'
});

const containerStyle = mergeStyles({
    padding: '1px 0',
});

const onRenderOption = (option: IDropdownOption): JSX.Element => {
    const icon = option.data && option.data.icon;
    const balance = option.data && option.data.balance;
    return <div>
        {icon && <Icon iconName={icon} className={iconStyle} aria-hidden="true" title={icon} />}
        <span>{option.text}</span>
        {balance && <Text variant={'small'}> {balance.toFormattedString()}</Text>}
    </div>;
};

class Component extends React.Component<AccountDropdownProps, {}> {
    
    constructor(props: AccountDropdownProps) {
        super(props);
        
        this.computeDropdownOptions = memoizeOne(this.computeDropdownOptions.bind(this));
    }

    render() {
        const dropdownChoices = this.computeDropdownOptions(this.props.groupedAccounts!, this.props.showBalance);

        let content;
        if (dropdownChoices.length === 0) {
            content = this.props.onRenderEmptyList && this.props.onRenderEmptyList();
        } else {
            content = <Dropdown
                label={this.props.label}
                selectedKey={this.props.selectedKey}
                onChange={this.props.onChange}
                placeholder={this.props.placeholder}
                options={dropdownChoices}
                onRenderOption={onRenderOption}
            />;
        }

        return <div className={containerStyle}>
            {content}
        </div>;
    }

    computeDropdownOptions(groupedAccounts: GroupedAccounts, showBalance?: boolean): IDropdownOption[] {
        let dropdownOptions: IDropdownOption[] = [];

        const unallocatedAccount = groupedAccounts[AccountType.Unallocated] && groupedAccounts[AccountType.Unallocated][0];
        if (unallocatedAccount) {
            dropdownOptions = dropdownOptions.concat([
                { 
                    key: unallocatedAccount._id, 
                    text: unallocatedAccount.name.trim(), 
                    data: { 
                        icon: 'Money',
                        balance: showBalance ? unallocatedAccount.balance : undefined,
                    },
                },
                { key: 'divider_1', text: '-', itemType: DropdownMenuItemType.Divider },
            ]);
        }

        [
            AccountType.Checking,
            AccountType.Savings,
            AccountType.CreditCard,
            AccountType.UserEnvelope,  
            AccountType.PaymentEnvelope,
        ].forEach(type => {
            const accounts = groupedAccounts[type];

            if (accounts && accounts.length > 0) {
                dropdownOptions = dropdownOptions.concat(
                    { 
                        key: `${type}-header`, 
                        text: getAccountTypeLabel(type), 
                        itemType: DropdownMenuItemType.Header 
                    },
                    accounts.map(account => ({ 
                        key: account._id, 
                        text: account.name, 
                        data: { 
                            icon: getAccountTypeIcon(account.type),
                            balance: showBalance ? account.balance : undefined,
                        }
                    }))
                )
            }
        });

        return dropdownOptions;
    }
}

const groupAccounts = memoizeOne((sortedIds: string[], accounts: Record<string, Account>, filter?: (account: Account) => boolean): GroupedAccounts => {
    return sortedIds.reduce(
        (grouped: GroupedAccounts, id: string) => {
            const account = accounts[id];
            if (!filter || filter(account)) {
                if (!grouped[account.type]) {
                    grouped[account.type] = [];
                }
                grouped[account.type].push(account);    
            }
            return grouped;
        },
        {} as GroupedAccounts
    );
});

const mapStateToProps = (state: CombinedState, ownProps: AccountDropdownProps): AccountDropdownProps => {
    return {
        ...ownProps,
        groupedAccounts: groupAccounts(state.accounts.sortedIds, state.accounts.accounts, ownProps.filter),
    };
}

export const AccountDropdown = connect(mapStateToProps, {})(Component);
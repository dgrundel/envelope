import { dismissModal, setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { getUnallocatedAccount } from '@/renderer/store/transforms/Account';
import { Currency } from '@/models/Currency';
import { filterOnlyAccountType } from '@/util/Filters';
import { DetailsList, DetailsListLayoutMode, IColumn, IconButton, IObjectWithKey, SelectionMode, Text, CommandBar, ICommandBarItemProps } from '@fluentui/react';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { MoveMoney } from '../transaction/MoveMoney';
import { Card } from '../uiElements/Card';
import { Layout } from '../uiElements/Layout';
import { BaseModal } from '../uiElements/Modal';
import { EnvelopeCreate } from './EnvelopeCreate';
import { Colors } from '../uiElements/styleValues';
import * as moment from 'moment';
import { Transaction } from '@models/Transaction';
import memoizeOne from 'memoize-one';
import { Log } from '@/util/Logger';

type CreditDebitMap = Record<string, {
    credits: Currency;
    debits: Currency;
}>;

export interface EnvelopesPageProps {
    // mapped from state
    userEnvelopes?: Account[];
    creditCardEnvelopes?: Account[];
    unallocatedAccount?: Account;
    lastMonthCreditsDebits?: CreditDebitMap;
    thisMonthCreditsDebits?: CreditDebitMap;

    //store actions
    setModal?: (modal: Modal) => void;
    dismissModal?: () => void;
}

enum ViewType {
    Cards = 'cards',
    List = 'list',
}

interface EnvelopesPageState {
    viewType: ViewType,
}

const columns: IColumn[] = [
    { key: 'column1', name: 'Envelope Name', fieldName: 'name', minWidth: 350, },
    { key: 'column2', name: 'Balance', fieldName: 'balance', minWidth: 100, maxWidth: 200,  },
    { key: 'column3', name: '+ Last Month', fieldName: 'lastMonthCredits', minWidth: 100, maxWidth: 200,  },
    { key: 'column4', name: '- Last Month', fieldName: 'lastMonthDebits', minWidth: 100, maxWidth: 200,  },
    { key: 'column5', name: '+ This Month', fieldName: 'thisMonthCredits', minWidth: 100, maxWidth: 200,  },
    { key: 'column6', name: '- This Month', fieldName: 'thisMonthDebits', minWidth: 100, maxWidth: 200,  },
    { key: 'column7', name: 'Actions', fieldName: 'actions', minWidth: 100, maxWidth: 120, isIconOnly: true, },
];

interface DetailListItem extends IObjectWithKey {
    name: string;
    balance: any;
    lastMonthCredits: any;
    lastMonthDebits: any;
    thisMonthCredits: any;
    thisMonthDebits: any;
    actions: any;
}

class Component extends React.Component<EnvelopesPageProps, EnvelopesPageState> {
    
    constructor(props: EnvelopesPageProps) {
        super(props);

        this.state = {
            viewType: ViewType.Cards,
        };

        Log.debug(props.lastMonthCreditsDebits);

        this.toListItem = this.toListItem.bind(this);
    }
    
    render() {
        const unallocatedAccount = (this.props.unallocatedAccount!);

        return <>
            <Layout split={2}>
                <Card heading="Available">
                    <p className={unallocatedAccount.balance.lt(Currency.ZERO) ? 'color-error' : ''}>
                        <Text variant={'xxLarge'}>{unallocatedAccount.balance.toFormattedString()}</Text>
                        {/* <IconButton iconProps={({ iconName: 'NewMail' })} title="Move Money to Envelope" onClick={() => this.showRemoveMoneyModal(unallocatedAccount)} /> */}
                    </p>

                    <MoveMoney fromId={unallocatedAccount._id} showFrom={false}/>
                </Card>
                <Card heading="Create an Envelope">
                    <EnvelopeCreate/>
                </Card>
            </Layout>
            
            {this.renderViewType()}
        </>;
    }

    renderViewType() {
        switch(this.state.viewType) {
            case ViewType.List:
                return this.renderList();
            case ViewType.Cards:
                return this.renderCards();
        }
    }

    renderList() {
        const items: DetailListItem[] = this.props.creditCardEnvelopes!.map(this.toListItem)
            .concat(this.props.userEnvelopes!.map(this.toListItem))

        return <Layout>
            <Card>
                {this.renderCommandBar()}
                <DetailsList
                    items={items}
                    columns={columns}
                    layoutMode={DetailsListLayoutMode.justified}
                    selectionMode={SelectionMode.none}
                />
            </Card>
        </Layout>;
    }

    renderCommandBar() {
        const items: ICommandBarItemProps[] = [
            {
                key: 'listToggle',
                text: this.state.viewType === ViewType.Cards ? 'Show as List' : 'Show as Cards',
                iconProps: {
                    iconName: this.state.viewType === ViewType.Cards ? 'List' : 'Favicon',
                },
                onClick: () => {
                    this.setState(prev => ({
                        viewType: prev.viewType === ViewType.Cards
                            ? ViewType.List
                            : ViewType.Cards
                    }))
                },
            }
        ];

        return <CommandBar items={items}/>;
    }

    toListItem(envelope: Account): DetailListItem {
        const thisMonthCreditsDebits = this.props.thisMonthCreditsDebits![envelope._id];
        const lastMonthCreditsDebits = this.props.lastMonthCreditsDebits![envelope._id];

        return {
            key: envelope._id,
            name: envelope.name,
            balance: <span style={{ color: envelope.balance.isNegative() ? Colors.Error : Colors.Success }}>
                {envelope.balance.toFormattedString()}
            </span>,
            lastMonthCredits: <span style={{ color: Colors.Success }}>{lastMonthCreditsDebits.credits.toFormattedString()}</span>,
            lastMonthDebits: <span style={{ color: Colors.Error }}>{lastMonthCreditsDebits.debits.toFormattedString()}</span>,
            thisMonthCredits: <span style={{ color: Colors.Success }}>{thisMonthCreditsDebits.credits.toFormattedString()}</span>,
            thisMonthDebits: <span style={{ color: Colors.Error }}>{thisMonthCreditsDebits.debits.toFormattedString()}</span>,
            actions: <>
                <IconButton style={{ height: '1em', }} iconProps={({ iconName: 'CalculatorAddition' })} title="Add Money" onClick={() => this.showAddMoneyModal(envelope)} />
                <IconButton style={{ height: '1em', }} iconProps={({ iconName: 'CalculatorSubtract' })} title="Remove Money" onClick={() => this.showRemoveMoneyModal(envelope)} />
            </>,
        };
    }

    renderCards() {
        return <>
            <Layout>
                <Card>
                    {this.renderCommandBar()}
                </Card>
            </Layout>
            <Layout split={3}>
                {this.props.creditCardEnvelopes!.map(e => this.renderEnvelopeCard(e))}
                {this.props.userEnvelopes!.map(e => this.renderEnvelopeCard(e))}
            </Layout>
        </>;
    }

    renderEnvelopeCard(envelope: Account) {
        const thisMonthCreditsDebits = this.props.thisMonthCreditsDebits![envelope._id];
        const lastMonthCreditsDebits = this.props.lastMonthCreditsDebits![envelope._id];
        
        return <Card key={envelope._id} heading={envelope.name}>
            <Layout split={3} noMargin>
                <div>
                    <p className={envelope.balance.lt(Currency.ZERO) ? 'color-error' : ''}>
                        <Text variant={'xxLarge'}>{envelope.balance.toFormattedString()}</Text>
                    </p>
                    <p>
                        <IconButton iconProps={({ iconName: 'CalculatorAddition' })} title="Add Money" onClick={() => this.showAddMoneyModal(envelope)} />
                        <IconButton iconProps={({ iconName: 'CalculatorSubtract' })} title="Remove Money" onClick={() => this.showRemoveMoneyModal(envelope)} />
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text variant={'xSmall'}>This Month</Text>
                    <div style={{ color: Colors.Success }}>+{thisMonthCreditsDebits.credits.toFormattedString()}</div>
                    <div style={{ color: Colors.Error }}>-{thisMonthCreditsDebits.debits.toFormattedString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text variant={'xSmall'}>Last Month</Text>
                    <div style={{ color: Colors.Success }}>+{lastMonthCreditsDebits.credits.toFormattedString()}</div>
                    <div style={{ color: Colors.Error }}>-{lastMonthCreditsDebits.debits.toFormattedString()}</div>
                </div>
            </Layout>
        </Card>;
    }

    showRemoveMoneyModal(envelope: Account) {
        const setModal = this.props.setModal!;
        const dismissModal = this.props.dismissModal!;

        const modal = <BaseModal heading={`Remove money from ${envelope.name}`} closeButtonHandler={dismissModal}>
            <MoveMoney fromId={envelope._id} showFrom={false} onComplete={dismissModal}/>
        </BaseModal>;

        setModal(modal);
    }

    showAddMoneyModal(envelope: Account) {
        const setModal = this.props.setModal!;
        const dismissModal = this.props.dismissModal!;

        // if the envelope is negative, suggest getting it back to zero
        const suggestedAmount = envelope.balance.isNegative() ? envelope.balance.getInverse() : undefined;

        const modal = <BaseModal heading={`Add money to ${envelope.name}`} closeButtonHandler={dismissModal}>
            <MoveMoney toId={envelope._id} showTo={false} onComplete={dismissModal} amount={suggestedAmount} />
        </BaseModal>;

        setModal(modal);
    }
}

const getCreditDebitMap = (transactions: Record<string, Transaction>, forAccounts: Account[], startDate: moment.Moment, endDate: moment.Moment): CreditDebitMap => {
    const map: CreditDebitMap = forAccounts.reduce((map: CreditDebitMap, account: Account) => {
        map[account._id] = {
            credits: Currency.ZERO,
            debits: Currency.ZERO,
        };
        return map;
    }, {});

    Object.values(transactions)
        .filter(transaction => map.hasOwnProperty(transaction.accountId)
            && moment(transaction.date).isBetween(startDate, endDate))
        .forEach((transaction: Transaction) => {
            if (transaction.amount.isPositive()) {
                map[transaction.accountId].credits = map[transaction.accountId].credits.add(transaction.amount)
            } else {
                map[transaction.accountId].debits = map[transaction.accountId].debits.sub(transaction.amount)
            }
        });
    return map;
};

const getThisMonthCreditsDebits = memoizeOne((transactions: Record<string, Transaction>, forAccounts: Account[]): CreditDebitMap => {
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    return getCreditDebitMap(transactions, forAccounts, startOfMonth, endOfMonth);
});

const getLastMonthCreditsDebits = memoizeOne((transactions: Record<string, Transaction>, forAccounts: Account[]): CreditDebitMap => {
    const lastMonth = moment().subtract(1, 'month');
    const startOfMonth = lastMonth.startOf('month');
    const endOfMonth = lastMonth.endOf('month');

    return getCreditDebitMap(transactions, forAccounts, startOfMonth, endOfMonth);
});

const mapStateToProps = (state: CombinedState, ownProps: EnvelopesPageProps): EnvelopesPageProps => {
    const allAcounts = state.accounts.sortedIds.map(id => state.accounts.accounts[id]);
    const userEnvelopes = allAcounts.filter(filterOnlyAccountType(AccountType.UserEnvelope));
    const creditCardEnvelopes = allAcounts.filter(filterOnlyAccountType(AccountType.PaymentEnvelope));
    
    const allEnvelopes = userEnvelopes.concat(creditCardEnvelopes);
    const lastMonthCreditsDebits = getLastMonthCreditsDebits(state.transactions.transactions, allEnvelopes);
    const thisMonthCreditsDebits = getThisMonthCreditsDebits(state.transactions.transactions, allEnvelopes);

    return {
        ...ownProps,
        userEnvelopes,
        creditCardEnvelopes,
        unallocatedAccount: getUnallocatedAccount(state.accounts),
        lastMonthCreditsDebits,
        thisMonthCreditsDebits,
    };
}

const storeActions = {
    setModal,
    dismissModal,
};

export const EnvelopesPage = connect(mapStateToProps, storeActions)(Component); 
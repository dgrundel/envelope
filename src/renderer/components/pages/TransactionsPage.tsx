import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { Account } from '@models/Account';
import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction, TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { getAppContext } from '@/renderer/AppContext';
import { Currency } from '@/util/Currency';
import { listToMap } from '@/util/Data';
import { Log } from '@/util/Logger';
import * as React from "react";
import { AddLinkedTransactions } from '../AddLinkedTransactions';
import { Box } from "../Box";
import { DataTable } from '../DataTable';
import { EventListener } from '../EventListener';

export interface TransactionsPageProps {
}

export interface TransactionsPageState {
    transactions: Transaction[];
    linkedTransactions: Record<string, Transaction>;
    accounts: Record<string, Account>;
    ready: boolean;
}

export class TransactionsPage extends EventListener<TransactionsPageProps, TransactionsPageState> {

    constructor(props: TransactionsPageProps) {
        super(props);

        const transactionDataStore = new TransactionDataStoreClient();
        const accountDataStore = new AccountDataStoreClient();
        
        this.state = {
            transactions: [],
            linkedTransactions: {},
            accounts: {},
            ready: false
        };

        Promise.all([
            this.refreshTransactions(transactionDataStore),
            this.refreshAccounts(accountDataStore)
        ]).then(() => this.setState({ ready: true }));
        
        this.addListener(() => transactionDataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshTransactions(transactionDataStore);
            }
        }));

        this.addListener(() => accountDataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshAccounts(accountDataStore);
            }
        }));
    }

    render() {
        return <Box heading="Transactions">
            {this.renderList()}
        </Box>;
    }

    refreshTransactions(transactionDataStore: TransactionDataStoreClient) {
        return transactionDataStore.getImportedTransactions().then(transactions => {
            this.setState({
                transactions
            });

            const linkedIds = transactions.reduce((ids: string[], transaction) => {
                return ids.concat(transaction.linkedTransactions || []);
            }, []);

            Log.debug('linkedIds', linkedIds);
            
            return transactionDataStore.getTransactionsById(linkedIds)
                .then(linkedTransactions => {
                    Log.debug('linkedTransactions', linkedTransactions);
                    this.setState({
                        linkedTransactions: listToMap(linkedTransactions)
                    });
                });
        });
    }

    refreshAccounts(accountDataStore: AccountDataStoreClient) {
        return accountDataStore.getUserAccounts().then(accounts => {
            this.setState({
                accounts: listToMap(accounts)
            });
        })
    }

    renderList() {
        if (this.state.ready) {
            return <DataTable<Transaction>
                rows={this.state.transactions}
                fields={[{
                    name: 'date',
                    label: 'Date',
                    formatter: (value, row) => row.date.toLocaleDateString()
                },{
                    name: 'accountName',
                    label: 'Account'
                },{
                    name: 'description',
                    label: 'Description'
                },{
                    name: 'amount',
                    label: 'Amount',
                    formatter: (value, row) => new Currency(row.wholeAmount, row.fractionalAmount).toFormattedString()
                },{
                    name: 'linkedTransactions',
                    label: '',
                    formatter: this.linkedTransactionsFormatter.bind(this)
                }]}
                keyField={'_id'}
                onSelect={(selected) => Log.debug('Table selection changed', selected)}
            />
        }

        return 'Just a moment...';
    }

    private linkedTransactionsFormatter(value: string, row: Transaction) {
        const linkedIds = row.linkedTransactions;
        const existingLinks = linkedIds?.map(id => this.state.linkedTransactions[id]) || [];
        const balance = existingLinks.reduce(
            (bal: Currency, link: Transaction) => {
                Log.debug('link', link);
                // subtract linked amounts to see if it zeros out
                return bal.sub(Currency.fromTransaction(link));
            },
            Currency.fromTransaction(row)
        );

        Log.debug('balance', row.description, balance.toString());
        
        const clickHander = (e: React.MouseEvent) => {
            e.preventDefault();

            const modal = <AddLinkedTransactions transaction={row} existingLinks={existingLinks} suggestedValue={balance} maxValue={balance} />;
            
            getAppContext().modalApi.queueModal(modal);
        };
        
        let icon = <i className="material-icons transaction-list-icon-unlinked">error_outline</i>;
        if (balance.isZero()) {
            icon = <i className="material-icons transaction-list-icon-linked">check_circle_outline</i>;
        }

        return <span onClick={clickHander}>
            {icon}
        </span>;
    }
}
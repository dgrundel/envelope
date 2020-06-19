import { DataStoreChange, recordsToMap } from '@/dataStore/BaseDataStore';
import { Account, AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction, TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Log } from '@/util/Logger';
import * as React from "react";
import { Box } from "../Box";
import { DataTable } from '../DataTable';
import { EventListener } from '../EventListener';
import { Currency } from '@/util/Currency';

export interface TransactionsPageProps {
}

export interface TransactionsPageState {
    transactions: Transaction[];
    linkedTransactions: Record<string, Transaction>;
    accounts: Record<string, Account>;
}

export class TransactionsPage extends EventListener<TransactionsPageProps, TransactionsPageState> {

    constructor(props: TransactionsPageProps) {
        super(props);

        const transactionDataStore = new TransactionDataStoreClient();
        const accountDataStore = new AccountDataStoreClient();
        
        this.state = {
            transactions: [],
            linkedTransactions: {},
            accounts: {}
        };

        this.refreshTransactions(transactionDataStore);
        this.refreshAccounts(accountDataStore);
  
        
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
        transactionDataStore.getImportedTransactions().then(transactions => {
            this.setState({
                transactions
            });

            const linkedIds = transactions.reduce((ids: string[], transaction) => {
                return ids.concat(transaction.linkedTransactions || []);
            }, []);

            transactionDataStore.getTransactionsById(linkedIds)
                .then(linkedTransactions => {
                    this.setState({
                        linkedTransactions: recordsToMap(linkedTransactions)
                    });
                });
        });
    }

    refreshAccounts(accountDataStore: AccountDataStoreClient) {
        accountDataStore.getUserAccounts().then(accounts => {
            this.setState({
                accounts: recordsToMap(accounts)
            });
        })
    }

    renderList() {
        if (this.state.transactions.length > 0) {
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

        return 'No transactions yet!';
    }

    private linkedTransactionsFormatter(value: string, row: Transaction) {
        const linked = row.linkedTransactions;
        if (linked && linked.length) {
            return <i className="material-icons transaction-list-icon-linked">check_circle_outline</i>;
        } else {
            return <i className="material-icons transaction-list-icon-unlinked">error_outline</i>;
        }
    }
}
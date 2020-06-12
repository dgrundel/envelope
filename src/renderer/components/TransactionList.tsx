import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { Account, AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction, TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { currencyFormatter } from '@/util/Formatters';
import { Log } from '@/util/Logger';
import * as React from "react";
import { Box } from "./Box";
import { DataTable } from './DataTable';
import { EventListener } from './EventListener';

export interface TransactionListProps {
}

export interface TransactionListState {
    transactions: Transaction[];
    accounts: Record<string, Account>;
}

export class TransactionList extends EventListener<TransactionListProps, TransactionListState> {

    constructor(props: TransactionListProps) {
        super(props);

        const transactionDataStore = new TransactionDataStoreClient();
        const accountDataStore = new AccountDataStoreClient();
        
        this.state = {
            transactions: [],
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
        transactionDataStore.getTransactions().then(transactions => {
            this.setState({
                transactions
            });
        });
    }

    refreshAccounts(accountDataStore: AccountDataStoreClient) {
        accountDataStore.getUserAccounts().then(accounts => {
            this.setState({
                accounts: accounts.reduce((map: Record<string, Account>, item: Account) => {
                    if (item._id) {
                        map[item._id] = item;
                    }
                    return map;
                }, {})
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
                    formatter: (value, row) => currencyFormatter(row.wholeAmount, row.fractionalAmount)
                }]}
                keyField={'_id'}
                onSelect={(selected) => Log.debug('Table selection changed', selected)}
            />
        }

        return 'No transactions yet!';
    }
}
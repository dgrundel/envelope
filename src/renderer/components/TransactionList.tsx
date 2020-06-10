import { DataStoreChange } from '@/dataStore/BaseDataStore';
import { BankAccount, BankAccountDataStoreClient } from '@/dataStore/impl/BankAccountDataStore';
import { BankAccountTransaction, BankAccountTransactionDataStoreClient } from '@/dataStore/impl/BankAccountTransactionDataStore';
import { currencyFormatter, dateFormatter } from '@/util/Formatters';
import * as React from "react";
import { Box } from "./Box";
import { DataTable } from './DataTable';
import { Log } from '@/util/Logger';

export interface TransactionListProps {
}

export interface TransactionListState {
    transactions: BankAccountTransaction[];
    bankAccounts: Record<string, BankAccount>;
}

export class TransactionList extends React.Component<TransactionListProps, TransactionListState> {

    constructor(props: TransactionListProps) {
        super(props);

        const transactionDataStore = new BankAccountTransactionDataStoreClient();
        const bankAccountDataStore = new BankAccountDataStoreClient();
        
        this.state = {
            transactions: [],
            bankAccounts: {}
        };

        this.refreshTransactions(transactionDataStore);
        this.refreshBankAccounts(bankAccountDataStore);
  
        transactionDataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshTransactions(transactionDataStore);
            }
        });

        bankAccountDataStore.onChange((change) => {
            if (change === DataStoreChange.Insert) {
                this.refreshBankAccounts(bankAccountDataStore);
            }
        })
    }

    render() {
        return <Box heading="Transactions">
            {this.renderList()}
        </Box>;
    }

    refreshTransactions(transactionDataStore: BankAccountTransactionDataStoreClient) {
        transactionDataStore.getTransactions().then(transactions => {
            this.setState({
                transactions
            });
        });
    }

    refreshBankAccounts(bankAccountDataStore: BankAccountDataStoreClient) {
        bankAccountDataStore.getAccounts().then(bankAccounts => {
            this.setState({
                bankAccounts: bankAccounts.reduce((map: Record<string, BankAccount>, item: BankAccount) => {
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
            return <DataTable<BankAccountTransaction>
                rows={this.state.transactions}
                fields={[{
                    name: 'date',
                    label: 'Date',
                    formatter: (value, row) => dateFormatter(row.year, row.month, row.day)
                },{
                    name: 'bankAccountName',
                    label: 'Bank Account'
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
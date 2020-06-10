import { remote } from 'electron';
import * as React from "react";
import { Box } from "./Box";
import { BankAccount, BankAccountType, BankAccountDataStoreClient } from '@/dataStore/impl/BankAccountDataStore';
import { DataStoreEvent, DataStoreChange } from '@/dataStore/BaseDataStore';
import { BankAccountTransactionDataStoreClient, BankAccountTransaction } from '@/dataStore/impl/BankAccountTransactionDataStore';
import { currencyFormatter, dateFormatter } from '@/util/Formatters';

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
            return <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Bank Account</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.transactions.map(transaction => <tr key={transaction._id}>
                        <td>{dateFormatter(transaction.year, transaction.month, transaction.day)}</td>
                        <td>{this.state.bankAccounts[transaction.bankAccountId]?.name}</td>
                        <td>{transaction.description}</td>
                        <td>{currencyFormatter(transaction.wholeAmount, transaction.fractionalAmount)}</td>
                    </tr>)}
                </tbody>
            </table>;
        }

        return 'No transactions yet!';
    }
}
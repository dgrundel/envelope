import * as React from "react";
import { CombinedState } from '@/renderer/store/store';
import { connect } from 'react-redux';
import { TransactionData } from "@/models/Transaction";
import { Account } from '@models/Account';
import { ImportWizardStepProps, rowsToTransactions } from '../ImportWizardFactory';

export interface ImportSummaryProps extends ImportWizardStepProps {
    selectedAccount?: Account;
}

class Component extends React.Component<ImportSummaryProps> {
    private readonly rowsAsTransactions: TransactionData[];
    
    constructor(props: ImportSummaryProps) {
        super(props);

        this.state = {};

        this.rowsAsTransactions = rowsToTransactions(
        this.props.rows, 
            false, 
            this.props.dateColumn!,
            this.props.amountColumn!,
            this.props.descriptionColumns!,
            this.props.accountId!
        );
    }
    
    render() {
        const transactions = this.rowsAsTransactions;
        const account = this.props.selectedAccount!;

        return <div>
            <h3>Ready to import your transactions into <strong>{account.name}</strong>.</h3>

            <table style={{minWidth: '60vw'}}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction, i) => <tr key={`${transaction.description}${i}`}>
                        <td>{transaction.date.toLocaleDateString()}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.amount.toFormattedString()}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    }
}

const mapStateToProps = (state: CombinedState, ownProps: ImportSummaryProps): ImportSummaryProps => {
    const id = ownProps.accountId;
    const selectedAccount = id ? state.accounts.accounts[id] : undefined;

    return {
        ...ownProps,
        selectedAccount,
    };
}

export const ImportSummary = connect(mapStateToProps, {})(Component);
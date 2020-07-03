import { Account } from "@/models/Account";
import { getAccountAmountTransactionFlag, TransactionData } from "@/models/Transaction";
import { getAppContext } from "@/renderer/AppContext";
import { insertTransactions } from "@/renderer/store/actions/Transaction";
import { CombinedState } from "@/renderer/store/store";
import { Currency } from "@/util/Currency";
import { Log } from '@/util/Logger';
import * as React from "react";
import { connect } from "react-redux";
import { AppPage } from "../../App";
import { createWizard, WizardStepApi } from "../../uiElements/WizardFactory";
import { AccountSelect } from './steps/AccountSelect';
import { AmountFieldSelect } from "./steps/AmountFieldSelect";
import { DateFieldSelect } from './steps/DateFieldSelect';
import { DescriptionFieldSelect } from "./steps/DescriptionFieldSelect";
import { DuplicatesSelect } from './steps/DuplicatesSelect';
import { InvertAmountsSelect } from "./steps/InvertAmountsSelect";


export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];
    invertTransactions: boolean;
    
    // indexes of the rows that will be imported
    selectedForImport?: number[];
    accountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
}

export type ImportWizardStepProps = ImportWizardState & WizardStepApi<ImportWizardState>;

export const rowToTransactionData = (
    row: Row,
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    account: Account
): TransactionData => {
    const currency = Currency.parse(row[amountColumn]);
    const amount = invert ? currency.getInverse() : currency;
    const flags = getAccountAmountTransactionFlag(account, amount);
    
    const accountId = account._id;
    const date = new Date(row[dateColumn]);
    const description = descriptionColumns
        .map(col => row[col])
        .join(' ');

    return {
        accountId,
        date,
        amount,
        description,
        importData: row,
        linkedTransactionIds: [],
        flags
    };
};

export const rowsToTransactions = (
    rows: Row[],
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    account: Account
): TransactionData[] => {
    return rows.map(row => rowToTransactionData(row, invert, dateColumn, amountColumn, descriptionColumns, account));
};

export const createImportWizard = (rows: Row[]) => {

    if (rows.length === 0) {
        throw new Error('Rows cannot be empty.');
    }

    interface Props {
        // mapped from store
        accounts?: Record<string, Account>;

        // store actions
        insertTransactions?: (transactionData: TransactionData[]) => Promise<void>;
    }

    class Component extends React.Component<Props> {
        InnerComponent: () => JSX.Element;
        
        constructor(props: Props) {
            super(props);

            this.InnerComponent = createWizard(
                {
                    title: `Importing ${rows.length} Transactions`,
                    onFinish: this.onFinish.bind(this),
                },
                {
                    rows,
                    invertTransactions: false,
                },
                [
                    AccountSelect,
                    DateFieldSelect,
                    AmountFieldSelect,
                    DescriptionFieldSelect,
                    InvertAmountsSelect,
                    DuplicatesSelect,
                ]
            );
        }

        onFinish(state: ImportWizardState) {
            Log.debug('Import Wizard Finish', state);

            const selectedAccount = this.props.accounts![state.accountId!];

            const rowsToImport = state.selectedForImport
                ? state.selectedForImport.map(i => state.rows[i])
                : state.rows;

            const rowsAsTransactions = rowsToTransactions(
                rowsToImport, 
                state.invertTransactions, 
                state.dateColumn!,
                state.amountColumn!,
                state.descriptionColumns!,
                selectedAccount,
            );

            this.props.insertTransactions!(rowsAsTransactions).then(() => {
                const appContext = getAppContext();
                // dismiss import modal
                appContext.modalApi.dismissModal();
                appContext.pageApi.setPage(AppPage.Transactions);
            });
        }

        render() {
            return <this.InnerComponent/>;
        }
    }

    const mapStateToProps = (state: CombinedState, ownProps: Props): Props => {
        return {
            ...ownProps,
            accounts: state.accounts.accounts,
        };
    }

    return connect(mapStateToProps, { insertTransactions })(Component);
}
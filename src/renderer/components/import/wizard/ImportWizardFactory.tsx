import { Account } from "@/models/Account";
import { getAmountTransactionFlag, Transaction } from "@/models/Transaction";
import { getAppContext } from "@/renderer/AppContext";
import { addManyTransactions } from "@/renderer/store/actions/Transaction";
import { CombinedState } from "@/renderer/store/store";
import { Currency } from "@/util/Currency";
import { getIdentifier } from '@/util/Identifier';
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

export const rowToTransaction = (
    row: Row,
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    account: Account
): Transaction => {
    const currency = Currency.parse(row[amountColumn]);
    const amount = invert ? currency.getInverse() : currency;
    const flags = getAmountTransactionFlag(account, amount);
    
    const accountId = account._id;
    const date = new Date(row[dateColumn]);
    const description = descriptionColumns
        .map(col => row[col])
        .join(' ');

    return {
        _id: getIdentifier(),
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
): Transaction[] => {
    return rows.map(row => rowToTransaction(row, invert, dateColumn, amountColumn, descriptionColumns, account));
};

export const createImportWizard = (rows: Row[]) => {

    if (rows.length === 0) {
        throw new Error('Rows cannot be empty.');
    }

    // look for some columns we can "suggest"
    const columnNames = Object.keys(rows[0]);
    
    // dateColumn: string,
    const dateColumn = columnNames.find(name => name.toLowerCase().includes('date'));
    // amountColumn: string,
    const amountColumn = columnNames.find(name => name.toLowerCase().includes('amount'));
    // descriptionColumns: string[],
    const descriptionColumns = columnNames.filter(name => name.toLowerCase().includes('description'));

    interface Props {
        // mapped from store
        accounts?: Record<string, Account>;

        // store actions
        addManyTransactions?: (transaction: Transaction[]) => void;
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
                    dateColumn,
                    amountColumn,
                    descriptionColumns,
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

            this.props.addManyTransactions!(rowsAsTransactions);
            
            const appContext = getAppContext();
            // dismiss import modal
            appContext.modalApi.dismissModal();
            appContext.pageApi.setPage(AppPage.Transactions);
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

    return connect(mapStateToProps, { addManyTransactions })(Component);
}
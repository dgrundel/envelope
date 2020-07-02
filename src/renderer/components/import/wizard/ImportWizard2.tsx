import { WizardStepApi, createWizard } from "../../uiElements/Wiz";
import { AccountSelect } from './AccountSelect';
import { Log } from '@/util/Logger';

export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];

    accountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
    invertTransactions: boolean;
}

export type ImportWizardStepProps = ImportWizardState & WizardStepApi<ImportWizardState>;

export const createImportWizard = (rows: Row[]) => {
    return createWizard(
        {
            title: `Importing ${rows.length} Transactions`,
            onFinish: (state: ImportWizardState) => {
                Log.debug('finish', state);
            },
            onCancel: (state: ImportWizardState) => {
                Log.debug('cancel', state);
            },
        },
        {
            rows,
            invertTransactions: false
        },
        [
            AccountSelect,
        ]
    );
}
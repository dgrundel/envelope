import { WizardStepApi } from "../../uiElements/Wiz";

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
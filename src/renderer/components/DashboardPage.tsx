import * as React from "react";
import { Box } from './uiElements/Box';
import { TestWizard } from "./uiElements/Wiz";
import { getAppContext } from "../AppContext";
import { createImportWizard } from './import/wizard/ImportWizard2';


export interface DashboardPageProps {
}

export class DashboardPage extends React.Component<DashboardPageProps, {}> {
    render() {
        return <>
            <Box heading="Getting Started">
                <p>Welcome to Envelope! Here are a few steps to get you going:</p>

                <ol>
                    <li>Click <strong>Accounts</strong> and add each of your bank and credit card accounts.</li>
                    <li>Click <strong>Envelopes</strong> and create a few envelopes for your budget.</li>
                    <li>Move some money from your <strong>Available Funds Envelope</strong> into your budget envelopes.</li>
                    <li><strong>Drag and Drop</strong> a CSV file exported from your bank's website to import bank and credit card transactions.</li>
                </ol>
            </Box>
            
            <Box heading="Test Wizard">
                <button onClick={() => {
                    getAppContext().modalApi.queueModal(<TestWizard/>);
                }}>Pop it</button>

                <button onClick={() => {
                    const Component = createImportWizard([{
                        'desc': 'foo',
                        'amount': '12.34',
                        'date': '7/1/2020'
                    },{
                        'desc': 'something else',
                        'amount': '1.47',
                        'date': '7/1/2020'
                    }]);
                    getAppContext().modalApi.queueModal(<Component/>);
                }}>createImportWizard</button>
            </Box>
        </>;
    }
}
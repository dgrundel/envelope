import * as React from "react";
import { Box } from './uiElements/Box';


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
            
        </>;
    }
}
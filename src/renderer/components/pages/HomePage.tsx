import * as React from "react";
import { TransactionList } from '../TransactionList';
import { Box } from '../Box';


export interface HomePageProps {
}

export class HomePage extends React.Component<HomePageProps, {}> {
    render() {
        return <>
            <Box>Welcome.</Box>
            <TransactionList/>
        </>;
    }
}
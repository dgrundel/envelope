import * as React from "react";
import { Box } from '../Box';


export interface DashboardPageProps {
}

export class DashboardPage extends React.Component<DashboardPageProps, {}> {
    render() {
        return <>
            <Box>Welcome.</Box>
        </>;
    }
}
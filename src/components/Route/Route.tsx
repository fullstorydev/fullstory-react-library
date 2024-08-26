import React, { ComponentType } from "react";
import { Route } from "react-router-dom";

export interface RouteProps {
    Component: ComponentType<any>;
    path: string;
    meta?: boolean;
}

const FSRoute: React.FC<RouteProps> = ({ Component: Component, path, meta = false }) => {
    return <Route path={path} element={<Component />} />;
};

export default FSRoute;

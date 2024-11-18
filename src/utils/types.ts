import { ReactNode } from "react";

export type CaptureOption = "meta" | "schema" | "all" | "url" | "none";
export type CaptureOptions = CaptureOption[];

export interface CaptureRules {
    [pathname: string]: CaptureOptions;
}
// Prop types for FullStoryProvider
export interface FullStoryProviderProps {
    children: ReactNode;
    capture?: CaptureOptions;
    rules?: CaptureRules;
}

export interface Schema extends SchemaType {
    "@context": string;
}

export interface FullStoryImage
    extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    id: string;
    name?: string;
    elementData?: any;
    key?: number | string;
}

export type FullStoryElementDataSingleTypes = "bool" | "date" | "int" | "real" | "str";
export type FullStoryElementDataManyTypes = "bools" | "dates" | "ints" | "reals" | "strs";
export type FullStoryElementDataTypes = FullStoryElementDataManyTypes | FullStoryElementDataSingleTypes;

export interface SingleTypeMap {
    "string": "str";
    "number": "real";
    "bigint": "int";
    "int": "int";
    "boolean": "bool";
}
export interface ManyTypeMap {
    "string": "strs";
    "number": "reals";
    "bigint": "ints";
    "int": "ints";
    "boolean": "bools";
}

export interface SchemaType {
    "@type": string | string[];
    [v: string]: string | number | SchemaType | any[];
}

export interface FullStorySchema {
    type: FullStoryElementDataTypes;
    name: string;
}

export interface ElementSchema {
    id: string;
    [v: string]: FullStorySchema | string;
}

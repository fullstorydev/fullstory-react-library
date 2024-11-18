import { CaptureOptions, CaptureRules, Schema, SchemaType } from "../components/FullStoryProvider/types";
import {
    FullStoryElementDataManyTypes,
    FullStoryElementDataTypes,
    ElementSchema,
    ManyTypeMap,
    SingleTypeMap,
    FullStoryImage
} from "./types";
import { isDate } from "date-fns";

function isNumber(value: any): boolean {
    return !isNaN(value);
}

function getMetaProperties(): any {
    // capture all meta tags in the DOM
    const metaTags: HTMLCollectionOf<HTMLMetaElement> = document.getElementsByTagName("meta");

    // create property store
    const props: { [v: string]: string } = {};

    // loop over tags and insert content into store
    for (let i = 0; i < metaTags.length; i++) {
        // find all the attributes on the meta tag
        const keys = metaTags[i].getAttributeNames();

        // if the meta tag doesn't include a content attribute we don't want it
        if (keys.includes("content")) {
            // EXECUTIVE DECISION: The first attribute on the tag will be the key
            const key: string = metaTags[i].getAttribute(keys[0]) as string;

            // find the index of content in the attribute array
            const contentIndex = keys.findIndex(x => x === "content");

            // capture the value of the content attribute
            const content = metaTags[i].getAttribute(keys[contentIndex]) as string;

            // insert the key and valuee into the property store
            props[key.replace("-", "_")] = content;
        }
    }

    return props;
}

function getType(schema: Schema | SchemaType, defType: string): string {
    let type = schema["@type"];
    switch (typeof type) {
        case "object":
            return type.join("_");
        case "string":
            return type;
        default:
            return !!defType ? defType : "";
    }
}

export function flattenArray(schemas: any[], properties: any, type: string): { [k: string]: any } {
    for (const schema of schemas) {
        if (typeof schema === "string") {
            properties[type] = properties[type] ? `${properties[type]}, ${schema}` : schema;
        } else {
            flattenSchema(schema, properties);
        }
    }

    return properties;
}

export function flattenSchema(
    schema: Schema | SchemaType,
    properties: any = {},
    type: string = ""
): { [k: string]: any } {
    // extract surface level type
    type = getType(schema, type);

    Object.keys(schema).map((x, i) => {
        // Capture the value of where we are in the object
        const val = schema[x];

        // prepare key to be joined
        const key = x.replace(/[^\w\s]/gi, "").toLocaleLowerCase();

        // take the type and make new keyname
        const keyName = type === "" ? key : `${type.toLowerCase()}_${key}`;

        // return if key is type or id
        if (x === "@type" || x === "@id") {
            return;
        }

        // if the value is an object run this function and flatten that values
        if (typeof val === "object") {
            // determine if object is a list or not
            Array.isArray(val) ? flattenArray(val, properties, keyName) : flattenSchema(val, properties, type);
            return;
        }

        // apply the value to the newly named key
        properties[keyName] = !!properties[keyName] ? `${properties[keyName]} / ${val}` : val;
    });

    return properties;
}

function escapeNewlinesInJsonLikeString(jsonLikeString: string) {
    // Matches content between quotes, accounting for escaped quotes inside the string.
    // @ts-ignore
    return jsonLikeString.replace(/"(.*?)"/gs, (match, group1) => {
        // Escape newlines inside of the string values
        const escapedValue = group1.replace(/\n/g, " ").replace(/\r/g, " ");
        return `"${escapedValue}"`;
    });
}

function getSchemaProperties(): any {
    // grab all scripts in DOM
    const scripts = document.getElementsByTagName("script");
    const schemas = [];

    // Find all schemas on the page and push them into schemas array
    for (let i = 0; i < scripts.length; i++) {
        // look for "type" on script tags
        const type = scripts[i].getAttribute("type");

        // push the element into schemas if types value is application/ld+json
        if (type === "application/ld+json") {
            schemas.push(scripts[i]);
        }
    }

    // Check if schemas were found
    if (schemas.length > 0) {
        try {
            // create store to hold properties
            const properties: any = {};

            // loop over schemas and input values into properties
            for (const schema of schemas) {
                const jsonOneLine = escapeNewlinesInJsonLikeString(schema.innerHTML);

                // Find content, we can expect it to be JSON parseable
                const content = JSON.parse(jsonOneLine);

                // flatten the schema
                const flatten = flattenSchema(content);

                // insert schema into properties
                Object.keys(flatten).map(x => {
                    // if key does not exist on object insert it into object
                    if (!properties[x]) {
                        properties[x] = flatten[x];
                    }
                });
            }

            return properties;
        } catch (error) {
            throw new Error("Can't parse schemas");
        }
    } else {
        return {};
    }
}

function getUrlProperties(search: string): any {
    if (search === "") {
        return {};
    }
    // Remove the leading '?' from the query string
    const query = search[0] === "?" ? search.substring(1) : search;

    // Split the query string into parts using '&' as the separator
    const parts = query.split("&");

    // Reduce the array of strings into an object with key-value pairs
    const params = parts.reduce((accumulator: any, current: any) => {
        // Split each part into key and value
        const [key, value] = current.split("=");

        // Find values data type
        let v: string | number = decodeURIComponent(value);
        switch (true) {
            case isNumber(v):
                v = parseInt(v);
            default:
                v = v;
        }

        // Change - to _ in key
        let k = key.replaceAll("-", "_");

        // Assign the key-value pair to the accumulator object, decoding the value
        accumulator[k] = v;

        return accumulator;
    }, {});

    return params;
}

function getUrlPathName(path: string): string {
    // if the path is not defined assume it's the home page
    if (path === "/") {
        return "Home Page";
    }

    // Split the path into segments
    const segments = path.split("/").filter(segment => segment);

    // Capitalize the first letter of each segment and join with ' / '
    const formattedPath = segments
        .map(segment =>
            segment // Split by hyphens for multi-word segment, capitalize, and then join.
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
        )
        .join(" / ");

    return formattedPath;
}

function getAllProperties(search: string): any {
    // get all properties from all options
    const schema = getSchemaProperties();
    const url = getUrlProperties(search);
    const meta = getMetaProperties();

    // create array for all properties
    const allProperties: { [v: string]: string }[] = [schema, url, meta];

    // create propertie store
    const properties: { [v: string]: string } = {};

    // flatten the properties by check for repeating values in objects
    for (const props of allProperties) {
        Object.keys(props).map(x => (properties[x] = !properties[x] ? props[x] : properties[x]));
    }

    return properties;
}

function getTypeOfObject(data: any): FullStoryElementDataManyTypes {
    // create many type map
    const typeMap: ManyTypeMap = {
        "string": "strs",
        "number": "reals",
        "bigint": "ints",
        "int": "ints",
        "boolean": "bools"
    };

    // if data is an array proceed or else throw error
    if (Array.isArray(data)) {
        const type = typeof data[0];

        // if Date return date
        if (isDate(data[0])) {
            return "dates";
        } else if (type === "undefined" || type === "symbol" || type === "function" || type === "object") {
            // if not fullstory type, throw error
            throw Error(`Data type of ${type} is not allowed`);
        } else {
            // return type from the map
            return typeMap[type];
        }
    } else {
        throw Error(`Data type of object is not allowed`);
    }
}

function getDataType(data: any): FullStoryElementDataTypes {
    // if string is date return date
    if (isDate(data)) {
        return "date";
    } else {
        // create a map that matches js types to fullstory types
        const typeMap: SingleTypeMap = {
            "string": "str",
            "number": "real",
            "bigint": "int",
            "int": "int",
            "boolean": "bool"
        };

        // grab data type
        const dataType = typeof data;

        // if these data types throw error
        if (dataType === "undefined" || dataType === "symbol" || dataType === "function") {
            throw Error(`Data type of ${dataType} is not allowed`);
        } else {
            // create type
            let type: FullStoryElementDataTypes;

            // if type is object dig deeper
            if (dataType === "object") {
                type = getTypeOfObject(data);
            } else {
                // grab type from map
                type = typeMap[dataType];
            }

            // return data type
            return type;
        }
    }
}

export function seperateProps(data: any): any {
    // grab keys
    const keys = Object.keys(data);

    // make data store
    const elementData: any = {};

    // loop through keys and find applicable data
    for (const k of keys) {
        // filter out key names of name and element data
        if (k !== "name" && k !== "elementData") {
            // apply custom props to store
            elementData[k] = data[k];
        }
    }

    // return custom props
    return elementData;
}

export function createTimingName(data: FullStoryImage): string {
    let name = "";

    // if element is named use the name
    if (data.name) {
        // if element has a key include key in the name
        name = data.key ? `fs-element-${data.name}-${data.key}` : `fs-element-${data.name}`;
    } else {
        // if no name use the data id and key if present
        name = data.key ? `fs-element-${data.id}-${data.key}` : `fs-element-${data.id}`;
    }

    return name;
}

export function createElementData(
    obj: any,
    name: string = ""
): { "data-fs-properties-schema": string; [v: string]: string } {
    // Find all keys
    const keys = Object.keys(obj);

    // create store for schema
    const schema: ElementSchema = { id: "str" };

    // create story for element data
    const elementData: { [v: string]: string } = name ? { "data-fs-element": name } : {};

    // loop over all keys
    for (const key of keys) {
        // find the data type of the keys vaue
        const type = getDataType(obj[key]);

        // create a fs approved schema name
        let k = `data-${key}`;

        // insert data into schema
        schema[k] = {
            name: key,
            type: type
        };

        // add to data element store
        elementData[k] = Array.isArray(obj[key]) ? obj[key] : obj[key].toString();
    }

    // return schema and element data
    return { ...elementData, "data-fs-properties-schema": JSON.stringify(schema) };
}

export function combineObjects(obj1: { [v: string]: string }, obj2: { [v: string]: string }): { [v: string]: string } {
    // create object store
    const obj: { [v: string]: string } = {};

    // put both objects in arr
    const arr = [obj1, obj2];

    // loop over objs and place them into store
    for (const o of arr) {
        Object.keys(o).map(x => (obj[x] = !obj[x] ? o[x] : obj[x]));
    }

    // return object
    return obj;
}

export function getPageName(path: string, capture: CaptureOptions, rules: CaptureRules, current: string): string {
    // Remove leading /
    const pathName = path === "/" ? path : path.replace("/", "");

    // Find capture rules
    const captureRules = !!rules[pathName] ? rules[pathName] : capture;

    // if rule is none return
    if (captureRules.includes("none")) {
        return "";
    }

    // check defualt capture for meta
    const pagename = !!current ? current : captureRules.includes("meta") ? document.title : getUrlPathName(path);

    return pagename;
}

export function getPageProperties(
    path: string,
    search: string,
    capture: CaptureOptions,
    rules: CaptureRules,
    current: any
): any {
    // Remove leading /
    const pathName = path === "/" ? path : path.replace("/", "");

    // if path is in the rules we use those rules
    const captureRules = !!rules[pathName] ? rules[pathName] : capture;

    // if rule is none we return an empty obj
    if (captureRules.includes("none")) {
        return {};
    }

    // create property store
    const properties: { [v: string]: string } = {};

    // if array includes all we run getAll and return
    if (captureRules.includes("all")) {
        return getAllProperties(search);
    }

    // loop over rules and input properties in property store
    for (const rule of captureRules) {
        // create temp store for properties
        let props: { [v: string]: string } = {};

        // choose which properties to extract by the rule
        if (rule === "meta") {
            props = getMetaProperties();
        }
        if (rule === "schema") {
            props = getSchemaProperties();
        }
        if (rule === "url") {
            props = getUrlProperties(search);
        }

        // check property store for duplicates and insert properties
        Object.keys(props).map(x => (properties[x] = !properties[x] ? props[x] : properties[x]));
    }

    const props = combineObjects(current, properties);

    return props;
}

import { CaptureOptions, CaptureRules, Schema, SchemaType } from "../components/FullStoryProvider/types";

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

export function flattenArray(schemas: any[], properties: any): { [k: string]: any } {
    for (const schema of schemas) {
        flattenSchema(schema, properties);
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

        // return if key is type or id
        if (x === "@type" || x === "@id") {
            return;
        }

        // if the value is an object run this function and flatten that values
        if (typeof val === "object") {
            // determine if object is a list or not
            Array.isArray(val) ? flattenArray(val, properties) : flattenSchema(val, properties, type);
            return;
        }

        // prepare key to be joined
        const key = x.replace(/[^\w\s]/gi, "").toLocaleLowerCase();

        // take the type and make new keyname
        const keyName = type === "" ? key : `${type.toLowerCase()}_${key}`;

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

export function combineObjects(obj1: { [v: string]: string }, obj2: { [v: string]: string }): { [v: string]: string } {
    // create object store
    const obj: { [v: string]: string } = {};

    // put both objects in arr
    const arr = [obj1, obj2];

    // loop over objs and place them into store
    for (const o of arr) {
        Object.keys(o).map(x => (obj[x] = !obj[x] ? o[x] : obj[x]));
    }

    return obj;
}

export function getPageName(path: string, capture: CaptureOptions, rules: CaptureRules): string {
    // remove leading slash from path
    const pathName = path.replace("/", "");

    // find rules we are capturing
    const captureRules = !!rules[pathName] ? rules[pathName] : capture;

    // if rule is none return
    if (captureRules.includes("none")) {
        return "";
    }

    // check defualt capture for meta
    const pagename = captureRules.includes("meta") ? document.title : getUrlPathName(path);

    return pagename;
}

export function getProperties(path: string, search: string, capture: CaptureOptions, rules: CaptureRules): any {
    // remove leading slash from path
    const pathName = path.replace("/", "");

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

    return properties;
}

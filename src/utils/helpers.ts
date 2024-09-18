import { CaptureOptions, CaptureRules, Schema, SchemaType } from "../components/FullStoryProvider/types";

function isNumber(value: any): boolean {
    return !isNaN(value);
}

// TODO: REWORK ALGO
function getMetaProperties(): any {
    const metaTags: HTMLCollectionOf<HTMLMetaElement> = document.getElementsByTagName("meta");
    const props: any = {};

    for (let i = 0; i < metaTags.length; i++) {
        const keys = metaTags[i].getAttributeNames();

        if (keys.includes("name") || keys.includes("property")) {
            const key: string = metaTags[i].getAttribute(keys[0]) as string;
            const content = metaTags[i].getAttribute(keys[1]);

            props[key] = content;
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
            return defType;
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
        const keyName = `${type.toLowerCase()}_${key}`;

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
    console.log("getting schema props");
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
        throw new Error("No schemas found");
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
    // Remove leading and trailing slashes
    const trimmedUrl = path.replace(/^\/|\/$/g, "");

    // Split the path into segments
    const segments = trimmedUrl.split("/");

    // Process segments to capitalize and exclude dynamic parts
    const pageNameParts = segments
        .map(segment => {
            // Exclude dynamic segments starting with ':'
            if (segment.startsWith(":")) {
                return "";
            }
            // Exclude the word "page" from segments unless it's inherent in the path
            if (segment.toLowerCase() === "page") {
                return "";
            }
            // Capitalize the first letter of each segment
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
        })
        .filter(part => part !== ""); // Remove any empty strings resulting from the mapping

    // Join the processed segments with a space
    const pageName = pageNameParts.join(" / ");

    return pageName;
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

export function getPageName(path: string, capture: CaptureOptions, rules: CaptureRules): string {
    // define pagename as a string
    let pagename = "";

    // check defualt capture for meta
    pagename = capture.includes("meta") ? document.title : getUrlPathName(path);

    // If path is in user defined rule, rename page with their suggested rule
    if (rules[path]) {
        pagename = rules[path].includes("meta") ? document.title : getUrlPathName(path);
    }

    return pagename;
}

export function getSearchProperties(path: string, search: string, capture: CaptureOptions, rules: CaptureRules): any {
    // create array for rules that copies default capture
    let captureRules = [...capture];

    // if path is in the rules we replace the array with the rules
    captureRules = !!rules[path] ? rules[path] : captureRules;

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

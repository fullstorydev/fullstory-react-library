import { CaptureOption, CaptureRules, Schema, SchemaType } from "../components/FullStoryProvider/types";

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

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function flattenSchema(schema: Schema | SchemaType, properties: any = {}): { [k: string]: any } {
    // extract surface level type
    const type = schema["@type"];

    Object.keys(schema).map((x, i) => {
        // Capture the value of where we are in the object
        const val = schema[x];

        // return if key is type or content
        if (x === "@type" || x === "@context") {
            return;
        }

        // if the value is an object run this function and flatten that values
        if (typeof val === "object") {
            flattenSchema(val, properties);
            return;
        }

        // prepare key to be joined
        const key = x
            .split("-")
            .map(y => capitalizeFirstLetter(y))
            .join("");

        // take the type and make new keyname
        const keyName = `${type.toLowerCase()}${key}`;

        // apply the value to the newly named key
        properties[keyName] = val;
    });

    return properties;
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
                // Find content, we can expect it to be JSON parseable
                const content = JSON.parse(schema.innerHTML);
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

    // flatten the properties
    const properties = { ...schema, ...url, ...meta };

    return properties;
}

export function getPageName(path: string, capture: CaptureOption, rules: CaptureRules): string {
    // define pagename as a string
    let pagename = "";

    // define rule as the default capture option
    let rule = capture;

    // If path is in user defined rule, use their suggested rule
    if (rules[path]) {
        rule = rules[path];
    }

    // Use switch to find the paganame by the rule
    switch (rule) {
        case "meta":
            pagename = document.title;
        default:
            pagename = getUrlPathName(path);
    }

    return pagename;
}

export function getSearchProperties(path: string, search: string, capture: CaptureOption, rules: CaptureRules): any {
    // Define default rule as capture option
    let rule = capture;

    // If path is in user defined rule, use their suggested rule
    if (rules[path]) {
        rule = rules[path];
    }

    // Use switch to find the properties by the rule
    switch (rule) {
        case "meta":
            return getMetaProperties();
        case "schema":
            return getSchemaProperties();
        case "url":
            return getUrlProperties(search);
        case "all":
            return getAllProperties(search);
    }
}

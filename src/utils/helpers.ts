export function getPageName(path: string, meta: boolean = false): string {
    if (meta) {
        return getMetaData();
    } else {
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
}

export function getVariables(search: any, meta: boolean = false): any {
    if (meta) {
        return getMetaData();
    } else {
        console.log("search", search);
        // const regex = /\/:[^\/]+/g; // The 'g' flag is used to replace all occurrences in the string
        // const noId = path.replace(regex, "");
        // const arr = noId.split("/");
        // const name = arr.join(" ");
        // return name;
    }
}

export function getMetaData(): string {
    return "Meta Data";
}

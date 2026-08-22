import { TGenericErrorResponse } from "../interfaces/error.types"



/* eslint-disable @typescript-eslint/no-explicit-any */
export const handlerDuplicateError = (err: any): TGenericErrorResponse => {
    let duplicateValue = "";

    // Try to extract from keyValue first
    if (err.keyValue && typeof err.keyValue === "object") {
        const values = Object.values(err.keyValue);
        if (values.length > 0) {
            duplicateValue = values.map(val => typeof val === 'object' ? JSON.stringify(val) : String(val)).join(', ');
        }
    }

    // Fallback to match in double quotes if keyValue is not available or empty
    if (!duplicateValue && err.message) {
        const matchedArray = err.message.match(/"([^"]*)"/);
        if (matchedArray && matchedArray[1]) {
            duplicateValue = matchedArray[1];
        }
    }

    // Final fallback
    if (!duplicateValue) {
        duplicateValue = "Duplicate value";
    }

    return {
        statusCode: 400,
        message: `${duplicateValue} already exists!!`
    }
}
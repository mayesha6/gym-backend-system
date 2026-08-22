import crypto from "crypto";

export const hashPayload = (payload: unknown): string => {
    const raw = JSON.stringify(payload);
    return crypto.createHash("sha256").update(raw).digest("hex");
};
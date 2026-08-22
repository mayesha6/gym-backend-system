import axios from "axios";
import { envVars } from "./env";

export const aiAxios = axios.create({
    baseURL: envVars.AI_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
});
import dotenv from "dotenv";
import { PayOS } from "@payos/node";

dotenv.config();

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

if (!clientId || !apiKey || !checksumKey) {
	throw new Error("Missing PayOS credentials. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env");
}

export const payOS = new PayOS({
	clientId,
	apiKey,
	checksumKey,
});

export function generateOrderCode() {
	// PayOS requires an integer orderCode (unique). Use a 10-11 digit timestamp based code.
	const now = Date.now(); // milliseconds since epoch
	const rand = Math.floor(Math.random() * 1000); // 0-999
	return Number(String(now).slice(-9) + String(rand).padStart(3, "0")); // 12 digits max
}



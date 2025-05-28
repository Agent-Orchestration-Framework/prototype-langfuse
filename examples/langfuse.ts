import { Langfuse } from 'langfuse';

// Prefer using environment variables for secrets
const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
const secretKey = process.env.LANGFUSE_SECRET_KEY;
export const baseUrl = process.env.LANGFUSE_BASEURL; // or self-hosted URL
//
if (!publicKey || !secretKey || !baseUrl) {
  throw new Error('Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY or LANGFUSE_BASEURL environment variable.');
}

export const langfuse = new Langfuse();
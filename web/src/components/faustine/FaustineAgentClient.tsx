"use client";

import { FaustineAgent } from "@faustine-ai/next/client";

const AGENT_ID = "3c3ff553-08bb-4db2-8d30-4afdcc9415a3";

/** Mounts the Faustine Web Agent once. Rendered from the root layout only. */
export function FaustineAgentClient({ identityJwt, debug }: { identityJwt?: string | null; debug?: boolean }) {
  return (
    <FaustineAgent
      agentId={AGENT_ID}
      identityJwt={identityJwt}
      env={process.env.NEXT_PUBLIC_FAUSTINE_ENV}
      debug={debug}
    />
  );
}

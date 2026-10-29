import { Suspense } from "react";
import { faustineIdentityToken } from "@faustine-ai/next";
import { getSessionUser } from "@/lib/auth/dal";
import { FaustineAgentClient } from "./FaustineAgentClient";

/**
 * Root-layout mount for the Faustine Web Agent. The identity depends on the
 * session cookie, so it is read behind its own Suspense boundary (the layout
 * itself stays prerenderable under Cache Components). Without
 * FAUSTINE_IDENTITY_SECRET the visitor is anonymous and the app still runs.
 * FAUSTINE_DEBUG=true opens a live debug session for the portal's Tests tab:
 * development and staging only, never in production.
 */
export function FaustineAgentMount() {
  return (
    <Suspense fallback={null}>
      <IdentifiedAgent />
    </Suspense>
  );
}

async function IdentifiedAgent() {
  const user = await getSessionUser();
  const identityJwt =
    user && process.env.FAUSTINE_IDENTITY_SECRET
      ? faustineIdentityToken({ id: user.id, name: user.name, email: user.email })
      : null;
  const debug = process.env.FAUSTINE_DEBUG === "true";
  return <FaustineAgentClient identityJwt={identityJwt} debug={debug} />;
}

import { NextApiRequest, NextApiResponse } from "next";
import { generateJWTAuthenticatorInputs } from "@zk-email/jwt-tx-builder-helpers/dist/input-generators";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { jwt, pubkey, maxMessageLength } = req.body;

    if (!jwt || !pubkey || !maxMessageLength) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const circuitInputs = await generateJWTAuthenticatorInputs(jwt, pubkey, BigInt(0), {
      maxMessageLength,
      exposeGoogleId: true,
    });

    const { accountCode, codeIndex, iatKeyStartIndex, ...filteredCircuitInputs } = circuitInputs;

    res.status(200).json(filteredCircuitInputs);
  } catch (error) {
    console.error("Error generating circuit inputs:", error);
    res.status(500).json({ error: "Failed to generate inputs" });
  }
}

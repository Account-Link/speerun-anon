import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log("Request body:", JSON.stringify(req.body));
    const response = await axios.post(
      "https://zkemail--teleport-nft-redeem-prover-v0-0-1-flask-app.modal.run/prove/teleport-nft-redeem",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Response:", response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error proxying request to JWT prover:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json({
          error: "Error from JWT prover service",
          message: error.response.data,
          status: error.response.status,
        });
      } else if (error.request) {
        res.status(503).json({
          error: "No response from JWT prover service",
          message: "The service might be down or unreachable",
        });
      } else {
        res.status(500).json({
          error: "Error setting up request to JWT prover",
          message: error.message,
        });
      }
    } else {
      res.status(500).json({
        error: "Unknown error occurred",
        message: "An unexpected error occurred while processing the request",
      });
    }
  }
}

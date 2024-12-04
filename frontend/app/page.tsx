/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConnectKitButton } from "connectkit";
import NFTRedeemerABI from "@/abi/NFTRedeemer.json";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useFormStatus } from "react-dom";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Loader2 } from "lucide-react";
import axios from "axios";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

function SubmitButton({ content }: { content: string }) {
  const { pending } = useFormStatus();
  const { writeContract } = useWriteContract();
  const { data: redeemData } = useWriteContract();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = (response: any) => {
    // Get content from textarea
    const content = (document.querySelector('textarea[name="content"]') as HTMLTextAreaElement)
      ?.value;
    console.log("Content to be posted:", content);

    const jwt = response.credential;
    console.log("JWT:", jwt);

    // Decode and log JWT parts
    const [headerB64, payloadB64] = jwt.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString("utf-8"));
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
    console.log("Decoded Header:", header);
    console.log("Decoded Payload:", payload);

    axios
      .get("https://www.googleapis.com/oauth2/v3/certs")
      .then((response) => {
        // Fetch the public key associated with the JWT
        const pubkey = response.data.keys.find((key: any) => key.kid === header.kid);
        console.log("Public Key:", pubkey);

        return { pubkey, header, payload };
      })
      .then((data) => {
        console.log("Data:", data);

        // Call our API endpoint
        return axios.post("/api/generateCircuitInputs", {
          jwt: jwt,
          pubkey: {
            n: data.pubkey.n,
            e: 65537,
          }, // RSA modulus from the public key
          maxMessageLength: 1024, // Adjust this value as needed
        });
      })
      .then((response) => {
        console.log("Circuit Inputs:", response.data);

        return axios.post("/api/proxyJwtProver", {
          input: response.data,
        });
      })
      .then((response) => {
        console.log("Proof:", response.data);
      })
      .catch((error) => console.error("Error:", error));
    // TODO: Once we have proof generation
    // writeContract({
    //   address: "0xF3Ee6EAE4Fcd555155b22C091878a9a533829D84",
    //   abi: NFTRedeemerABI.abi,
    //   functionName: "redeemNFT",
    //   args: [content], // Will be replaced with proof later
    // });
  };

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleCredentialResponse,
      nonce: content,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with_google",
      width: buttonRef.current.offsetWidth,
    });
  }, [content]);

  return (
    <div
      ref={buttonRef}
      className="w-full h-12"
      style={{
        opacity: content ? 1 : 0.5,
        pointerEvents: content ? "auto" : "none",
      }}
    />
  );
}

export default function Home() {
  const { writeContract } = useWriteContract();
  const { data: hash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [mockHash, setMockHash] = useState<string | null>(
    process.env.NODE_ENV === "development" ? null : null,
  );
  const [mockSuccess, setMockSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;

    if (!content) return;

    writeContract({
      address: "0xF3Ee6EAE4Fcd555155b22C091878a9a533829D84",
      abi: NFTRedeemerABI.abi,
      functionName: "redeemNFT",
      args: [content],
    });
  };

  const testSuccessFlow =
    process.env.NODE_ENV === "development"
      ? () => {
          setMockHash("0xa4bf67ce9ab78a5195e839dfbf4f5711f754aedb0ec675f372061c4b9dce2f84");
          setTimeout(() => setMockSuccess(true), 2000);
        }
      : undefined;

  return (
    <>
      <div className="absolute top-8 right-8 sm:top-10 sm:right-10">
        <ConnectKitButton />
      </div>
      <main className="flex flex-col gap-8 justify-center items-center min-h-screen">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Anon Speedrun: Post anonymously to X</CardTitle>
              <CardDescription>
                Enter your text here and we will post it in anon for you.
                <br />
                Posts are made anonymous using TEEs.
                <br />
                Holder requirements: 500 $ANON.
                <br />
                Check https://x.com/UUnuy for posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="content"
                className="h-48"
                placeholder="Enter your text here..."
                required
                minLength={1}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <SubmitButton content={content} />
            </CardFooter>
          </Card>
        </form>

        {process.env.NODE_ENV === "development" && (
          <Button onClick={testSuccessFlow} variant="outline">
            Test Success Flow
          </Button>
        )}

        <Dialog
          open={hash || (process.env.NODE_ENV === "development" && mockHash) ? isDialogOpen : false}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Transaction Status</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {!isSuccess && !(process.env.NODE_ENV === "development" && mockSuccess) && (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">Confirming transaction...</p>
                </div>
              )}
              {(isSuccess || (process.env.NODE_ENV === "development" && mockSuccess)) && (
                <>
                  <p className="text-green-600 text-lg flex items-center gap-2">
                    Transaction confirmed! ✨
                  </p>
                  <a
                    href={`https://basescan.org/tx/${
                      hash || (process.env.NODE_ENV === "development" ? mockHash : "")
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                  >
                    View on Basescan
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

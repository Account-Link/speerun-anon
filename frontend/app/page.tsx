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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { data: redeemData } = useWriteContract();

  return (
    <Button type="submit" className="w-full" disabled={pending || Boolean(redeemData)}>
      {redeemData ? "Submitting..." : "Submit"}
    </Button>
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
              />
            </CardContent>
            <CardFooter>
              <SubmitButton />
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
                    href={`https://basescan.org/tx/${hash || (process.env.NODE_ENV === "development" ? mockHash : "")}`}
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

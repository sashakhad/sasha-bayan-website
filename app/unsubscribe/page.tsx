"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");

  const [email, setEmail] = useState(emailFromUrl || "");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(
          "Successfully unsubscribed! You won't receive any more emails from us.",
        );
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to unsubscribe. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 -mb-20 flex w-full justify-between bg-primary px-5 py-5 text-sm text-black">
        <Link href="/">
          <h4 className="flex items-center text-sm font-thin uppercase tracking-widest transition-all duration-700">
            Sasha Bayan
          </h4>
        </Link>
      </div>

      <div className="flex w-full items-center gap-3 bg-primary pl-7 pt-20 sm:pl-20">
        <h1 className="font-glosa-display text-5xl text-dark">Unsubscribe</h1>
      </div>

      <div className="flex min-h-screen w-full justify-center bg-primary px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-dark">
              Unsubscribe from Newsletter
            </h2>

            <p className="mb-6 text-gray-600">
              We're sorry to see you go! Enter your email address below to
              unsubscribe from our newsletter.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-dark"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-dark focus:outline-none focus:ring-dark"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-md bg-dark px-4 py-2 text-primary transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 disabled:opacity-50"
              >
                {status === "loading" ? "Unsubscribing..." : "Unsubscribe"}
              </button>
            </form>

            {status === "success" && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Changed your mind?{" "}
                <Link
                  href="/mailing-list"
                  className="text-dark hover:underline"
                >
                  Resubscribe here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";

interface BkashPaymentUIProps {
  amount: number | string;
  currency?: string;
  transactionPhoneNo: string;
  setTransactionPhoneNo: (val: string) => void;
  transactionId: string;
  setTransactionId: (val: string) => void;
  receiverNumber?: string;
  onVerify?: () => void;
  isVerifying?: boolean;
  showVerifyButton?: boolean;
}

export default function BkashPaymentUI({
  amount,
  currency = "BDT",
  transactionPhoneNo,
  setTransactionPhoneNo,
  transactionId,
  setTransactionId,
  receiverNumber = "01711111111",
  onVerify,
  isVerifying = false,
  showVerifyButton = false,
}: BkashPaymentUIProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    const rawNumber = receiverNumber.replace(/-/g, "");
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAmount =
    typeof amount === "number" ? amount.toLocaleString() : amount;

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 font-sans text-left">
      {/* 1. Header Bar: bKash Logo + Amount */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        {/* bKash Logo Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-center shadow-xs">
            <Image
              src="/bKash.png"
              alt="bKash"
              width={140}
              height={50}
              className="h-10 sm:h-12 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {formattedAmount} {currency}
          </span>
        </div>
      </div>

      {/* 2. Yellow Warning Banner */}
      <div className="bg-[#fefce8] dark:bg-amber-950/40 border border-[#fef08a] dark:border-amber-800/50 p-2.5 rounded-xl text-center">
        <p className="text-xs font-bold text-[#b45309] dark:text-amber-300">
          <span className="font-extrabold">Note:</span> Please verify 5-10 seconds after sending money.
        </p>
      </div>

      {/* 3. Main Pink bKash Container */}
      <div className="bg-[#e2136e] rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-5">
        {/* Title */}
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
            Enter Transaction Details
          </h3>
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-white/90 mb-1">
              Sender bKash Mobile *
            </label>
            <input
              type="tel"
              required
              maxLength={11}
              value={transactionPhoneNo}
              onChange={(e) =>
                setTransactionPhoneNo(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="e.g. 01712345678"
              className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl font-mono font-bold text-sm outline-none placeholder:text-gray-400 placeholder:font-normal focus:ring-4 focus:ring-pink-300 shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-white/90 mb-1">
              Transaction ID (TrxID) *
            </label>
            <input
              type="text"
              required
              maxLength={11}
              value={transactionId}
              onChange={(e) =>
                setTransactionId(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11)
                )
              }
              placeholder="Enter Transaction ID (e.g. 9B7X2K1L8M)"
              className="w-full px-4 py-3 bg-white text-gray-900 uppercase rounded-xl font-mono font-bold text-sm outline-none placeholder:text-gray-400 placeholder:font-normal focus:ring-4 focus:ring-pink-300 shadow-inner transition-all"
            />
          </div>
        </div>

        {/* Instructions Section */}
        <div className="pt-2 border-t border-white/20">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/90 mb-3">
            INSTRUCTIONS
          </h4>

          <ul className="space-y-2.5 text-xs text-white/95 font-medium leading-relaxed">
            <li className="flex items-start gap-2 pt-1 border-t border-white/10">
              <span className="font-bold">•</span>
              <span>
                <strong className="font-extrabold text-white">*247#</strong> dial to go to your <strong className="font-extrabold text-white">BKASH</strong> mobile menu or open <strong className="font-extrabold text-white">BKASH</strong> app.
              </span>
            </li>

            <li className="flex items-start gap-2 pt-2 border-t border-white/10">
              <span className="font-bold">•</span>
              <span>
                Click <strong className="font-extrabold text-white">&quot;Send Money&quot;</strong>
              </span>
            </li>

            <li className="flex items-start gap-2 pt-2 border-t border-white/10">
              <span className="font-bold">•</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span>Write this number as receiver number:</span>
                <strong className="font-extrabold text-white font-mono text-sm px-1.5 py-0.5 bg-white/15 rounded">
                  {receiverNumber}
                </strong>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="inline-flex items-center gap-1 bg-white text-[#e2136e] hover:bg-gray-100 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all shadow-xs active:scale-95"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </li>

            <li className="flex items-start gap-2 pt-2 border-t border-white/10">
              <span className="font-bold">•</span>
              <span>
                Enter amount <strong className="font-extrabold text-white">{formattedAmount} {currency}</strong> and click <strong className="font-extrabold text-white">SUBMIT</strong>.
              </span>
            </li>

            <li className="flex items-start gap-2 pt-2 border-t border-white/10">
              <span className="font-bold">•</span>
              <span>
                Now enter your <strong className="font-extrabold text-white">Transaction ID</strong> in the box above and click <strong className="font-extrabold text-white">VERIFY</strong>.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Bottom Verify Button (If enabled or when standalone modal/card) */}
      {showVerifyButton && (
        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying || !transactionPhoneNo || !transactionId}
          className="w-full bg-[#e2136e] hover:bg-[#c40f5e] disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl uppercase tracking-wider shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isVerifying ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "VERIFY TRANSACTION"
          )}
        </button>
      )}
    </div>
  );
}

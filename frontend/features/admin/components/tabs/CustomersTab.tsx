"use client";

import { useState } from "react";
import { CustomerItem, Order } from "../../types";
import CustomerSearchBar from "@/features/customers/components/CustomerSearchBar";
import { useLanguage } from "@/store/LanguageContext";

interface CustomersTabProps {
  customers: CustomerItem[];
  token: string | null;
  handleViewCustomerHistory: (customerId: number) => Promise<void>;
  customerHistoryModal: {
    customerId: number;
    orders: Order[];
  } | null;
  setCustomerHistoryModal: React.Dispatch<
    React.SetStateAction<{
      customerId: number;
      orders: Order[];
    } | null>
  >;
}

export default function CustomersTab({
  customers,
  token,
  handleViewCustomerHistory,
  customerHistoryModal,
  setCustomerHistoryModal,
}: CustomersTabProps) {
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

  const [activeCustomerQuery, setActiveCustomerQuery] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      String(c.id).includes(activeCustomerQuery) ||
      (c.customer_name &&
        c.customer_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      (c.first_name &&
        c.first_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      (c.last_name &&
        c.last_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      `${c.first_name || ""} ${c.last_name || ""}`
        .toLowerCase()
        .includes(activeCustomerQuery.toLowerCase()) ||
      (c.email &&
        c.email.toLowerCase().includes(activeCustomerQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(activeCustomerQuery)) ||
      (c.membership &&
        c.membership.toLowerCase().includes(activeCustomerQuery.toLowerCase()))
  );

  return (
    <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
          {isBn
            ? `নিবন্ধিত গ্রাহকবৃন্দ (${filteredCustomers.length.toLocaleString("bn-BD")})`
            : `Registered Customers (${filteredCustomers.length})`}
        </h2>
        <CustomerSearchBar
          token={token}
          initialSearch={activeCustomerQuery}
          onSelectCustomer={(cust) => {
            handleViewCustomerHistory(cust.id);
          }}
          onSearchSubmit={(q) => {
            setActiveCustomerQuery(q);
          }}
          onClear={() => {
            setActiveCustomerQuery("");
          }}
        />
      </div>
      {filteredCustomers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                <th className="py-3 px-2">{isBn ? "গ্রাহকের নাম" : "Customer Name"}</th>
                <th className="py-3 px-2">{isBn ? "মোবাইল নম্বর" : "Phone"}</th>
                <th className="py-3 px-2">{isBn ? "মেম্বারশিপ" : "Membership"}</th>
                <th className="py-3 px-2 text-right">{isBn ? "কার্যক্রম" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10 text-xs font-bold">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className="hover:bg-primary/5 dark:hover:bg-primary/30 transition-colors"
                >
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-black text-xs flex items-center justify-center flex-shrink-0 border border-accent/20">
                        {(
                          (cust.first_name ? cust.first_name[0] : "") +
                            (cust.last_name ? cust.last_name[0] : "") ||
                          cust.customer_name?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-foreground">
                          {cust.first_name || cust.last_name
                            ? `${cust.first_name || ""} ${cust.last_name || ""}`.trim()
                            : cust.customer_name || (isBn ? `গ্রাহক #${cust.id}` : `Customer #${cust.id}`)}
                        </div>
                        <div className="text-[10px] opacity-60 flex items-center gap-1.5 font-medium">
                          <span>@{cust.customer_name}</span>
                          {cust.email && <span>• {cust.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 opacity-80">
                    {cust.phone || (isBn ? "ফোন নম্বর যুক্ত নেই" : "No Phone Registered")}
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] uppercase font-black tracking-wider">
                      {cust.membership === "G"
                        ? (isBn ? "গোল্ড (G)" : "Gold (G)")
                        : cust.membership === "S"
                          ? (isBn ? "সিলভার (S)" : "Silver (S)")
                          : (isBn ? "ব্রোঞ্জ (B)" : "Bronze (B)")}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleViewCustomerHistory(cust.id)}
                      className="px-3.5 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                    >
                      {isBn ? "অর্ডার ইতিহাস দেখুন" : "View Order History"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
          {isBn ? "কোনো গ্রাহক পাওয়া যায়নি।" : "No customers found."}
        </div>
      )}

      {/* Customer Order History Modal */}
      {customerHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-foreground/10 relative max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {isBn
                    ? `অর্ডার ইতিহাস - গ্রাহক #${customerHistoryModal.customerId.toLocaleString("bn-BD")}`
                    : `Order History - Customer #${customerHistoryModal.customerId}`}
                </h3>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                  {isBn
                    ? `মোট অর্ডারঃ ${customerHistoryModal.orders.length.toLocaleString("bn-BD")} টি`
                    : `Total Orders: ${customerHistoryModal.orders.length}`}
                </span>
              </div>
              <button
                onClick={() => setCustomerHistoryModal(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>

            {customerHistoryModal.orders.length > 0 ? (
              <div className="space-y-4">
                {customerHistoryModal.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-black text-sm">
                        {isBn ? `অর্ডার #${ord.id.toLocaleString("bn-BD")}` : `Order #${ord.id}`}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black ${
                          ord.payment_status === "C"
                            ? "bg-green-500/20 text-green-500"
                            : ord.payment_status === "F"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {ord.payment_status === "C"
                          ? (isBn ? "সফল (Complete)" : "Complete")
                          : ord.payment_status === "F"
                            ? (isBn ? "ব্যর্থ (Failed)" : "Failed")
                            : (isBn ? "পেন্ডিং (Pending)" : "Pending")}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70">
                      <strong>{isBn ? "অর্ডারের সময়:" : "Placed At:"}</strong>{" "}
                      {ord.placed_at
                        ? new Date(ord.placed_at).toLocaleString(isBn ? "bn-BD" : "en-US")
                        : "N/A"}
                    </p>
                    <p className="text-[11px] opacity-70">
                      <strong>{isBn ? "ঠিকানা:" : "Shipping:"}</strong>{" "}
                      {ord.shipping_address || (isBn ? "নেই" : "N/A")} |{" "}
                      <strong>{isBn ? "ফোন:" : "Phone:"}</strong> {ord.phone || (isBn ? "নেই" : "N/A")}
                    </p>
                    <p className="text-[11px] opacity-70">
                      <strong>{isBn ? "পেমেন্ট মাধ্যম:" : "Payment Method:"}</strong>{" "}
                      {ord.payment_method === "V" ? (
                        <span className="inline-flex items-center gap-1 align-middle">
                          <img
                            src="/VibeCoin/VibeCoin.png"
                            alt="VibeCoin"
                            className="w-3.5 h-3.5 object-contain inline"
                          />{" "}
                          {isBn ? "ভাইবকয়েন পেমেন্ট" : "VibeCoin Payment"}
                        </span>
                      ) : ord.payment_method === "O" ||
                        ord.payment_method === "B" ? (
                        `bKash (TrxID: ${ord.transaction_id || "N/A"})`
                      ) : ord.payment_method === "N" ? (
                        `Nagad (TrxID: ${ord.transaction_id || "N/A"})`
                      ) : (
                        isBn ? "ক্যাশ অন ডেলিভারি (COD)" : "Cash on Delivery (COD)"
                      )}
                    </p>

                    {ord.items && ord.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-foreground/10 space-y-1">
                        <p className="text-[10px] font-black uppercase opacity-60">
                          {isBn ? "পণ্যসমূহ:" : "Items:"}
                        </p>
                        {ord.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex justify-between text-[11px]"
                          >
                            <span>
                              {it.product?.title || (isBn ? `পণ্য #${it.product}` : `Product #${it.product}`)}{" "}
                              x {isBn ? it.quantity.toLocaleString("bn-BD") : it.quantity}
                            </span>
                            <span className="font-bold">
                              {formatCurrency(it.quantity * Number(it.unit_price))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                {isBn ? "এই গ্রাহক এখনও কোনো অর্ডার করেননি।" : "This customer has not placed any orders yet."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

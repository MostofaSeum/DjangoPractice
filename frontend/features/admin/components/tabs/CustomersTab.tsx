"use client";

import { useState } from "react";
import { CustomerItem, Order } from "../../types";
import CustomerSearchBar from "@/features/customers/components/CustomerSearchBar";

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
          Registered Customers ({filteredCustomers.length})
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
                <th className="py-3 px-2">Customer Name</th>
                <th className="py-3 px-2">Phone</th>
                <th className="py-3 px-2">Membership</th>
                <th className="py-3 px-2 text-right">Actions</th>
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
                            : cust.customer_name || `Customer #${cust.id}`}
                        </div>
                        <div className="text-[10px] opacity-60 flex items-center gap-1.5 font-medium">
                          <span>@{cust.customer_name}</span>
                          {cust.email && <span>• {cust.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 opacity-80">
                    {cust.phone || "No Phone Registered"}
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] uppercase font-black tracking-wider">
                      {cust.membership === "G"
                        ? "Gold (G)"
                        : cust.membership === "S"
                          ? "Silver (S)"
                          : "Bronze (B)"}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleViewCustomerHistory(cust.id)}
                      className="px-3.5 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                    >
                      View Order History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
          No customers found.
        </div>
      )}

      {/* Customer Order History Modal */}
      {customerHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-foreground/10 relative max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Order History - Customer #{customerHistoryModal.customerId}
                </h3>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                  Total Orders: {customerHistoryModal.orders.length}
                </span>
              </div>
              <button
                onClick={() => setCustomerHistoryModal(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase"
              >
                Close
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
                        Order #{ord.id}
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
                          ? "Complete"
                          : ord.payment_status === "F"
                            ? "Failed"
                            : "Pending"}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70">
                      <strong>Placed At:</strong>{" "}
                      {ord.placed_at
                        ? new Date(ord.placed_at).toLocaleString()
                        : "N/A"}
                    </p>
                    <p className="text-[11px] opacity-70">
                      <strong>Shipping:</strong>{" "}
                      {ord.shipping_address || "N/A"} |{" "}
                      <strong>Phone:</strong> {ord.phone || "N/A"}
                    </p>
                    <p className="text-[11px] opacity-70">
                      <strong>Payment Method:</strong>{" "}
                      {ord.payment_method === "V" ? (
                        <span className="inline-flex items-center gap-1 align-middle">
                          <img
                            src="/VibeCoin/VibeCoin.png"
                            alt="VibeCoin"
                            className="w-3.5 h-3.5 object-contain inline"
                          />{" "}
                          VibeCoin Payment
                        </span>
                      ) : ord.payment_method === "O" ||
                        ord.payment_method === "B" ? (
                        `bKash (TrxID: ${ord.transaction_id || "N/A"})`
                      ) : ord.payment_method === "N" ? (
                        `Nagad (TrxID: ${ord.transaction_id || "N/A"})`
                      ) : (
                        "Cash on Delivery (COD)"
                      )}
                    </p>

                    {ord.items && ord.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-foreground/10 space-y-1">
                        <p className="text-[10px] font-black uppercase opacity-60">
                          Items:
                        </p>
                        {ord.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex justify-between text-[11px]"
                          >
                            <span>
                              {it.product?.title || `Product #${it.product}`}{" "}
                              x {it.quantity}
                            </span>
                            <span className="font-bold">
                              ৳{(it.quantity * Number(it.unit_price)).toFixed(2)}
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
                This customer has not placed any orders yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

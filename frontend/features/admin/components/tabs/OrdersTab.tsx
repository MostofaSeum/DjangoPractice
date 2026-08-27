"use client";

import { useState, useEffect } from "react";
import { Order } from "../../types";
import { useLanguage } from "@/store/LanguageContext";

interface OrdersTabProps {
  orders: Order[];
  handleUpdateOrderStatus: (orderId: number, status: string) => Promise<void>;
  handleDeleteOrder: (orderId: number) => Promise<void>;
  targetOrderId?: string | null;
}

export default function OrdersTab({
  orders,
  handleUpdateOrderStatus,
  handleDeleteOrder,
  targetOrderId = null,
}: OrdersTabProps) {
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

  const [orderSearch, setOrderSearch] = useState("");
  const [activeOrderQuery, setActiveOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | "P" | "F" | "C"
  >("ALL");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(
    null
  );

  useEffect(() => {
    if (targetOrderId && orders.length > 0) {
      const match = orders.find((o) => String(o.id) === String(targetOrderId));
      if (match) {
        setSelectedOrderDetails(match);
      }
    }
  }, [targetOrderId, orders]);

  const filteredOrders = orders
    .filter((o) => {
      if (orderStatusFilter === "ALL") return true;
      return o.payment_status === orderStatusFilter;
    })
    .filter((o) => {
      if (!activeOrderQuery) return true;
      return (
        String(o.id).includes(activeOrderQuery) ||
        (o.customer_name &&
          o.customer_name
            .toLowerCase()
            .includes(activeOrderQuery.toLowerCase())) ||
        String(o.customer).includes(activeOrderQuery) ||
        (o.phone && o.phone.includes(activeOrderQuery)) ||
        (o.shipping_address &&
          o.shipping_address
            .toLowerCase()
            .includes(activeOrderQuery.toLowerCase()))
      );
    });

  return (
    <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-foreground/10">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-primary/5 dark:bg-primary/30 rounded-xl border border-foreground/10">
            {[
              {
                id: "ALL" as const,
                label: isBn ? "সকল অর্ডার" : "All Orders",
                count: orders.length,
              },
              {
                id: "P" as const,
                label: isBn ? "পেন্ডিং (অপেক্ষারত)" : "Pending",
                count: orders.filter((o) => o.payment_status === "P").length,
                color: "text-amber-500",
              },
              {
                id: "C" as const,
                label: isBn ? "সফল (কমপ্লিট)" : "Complete",
                count: orders.filter((o) => o.payment_status === "C").length,
                color: "text-emerald-500",
              },
              {
                id: "F" as const,
                label: isBn ? "ব্যর্থ / বাতিল" : "Failed",
                count: orders.filter((o) => o.payment_status === "F").length,
                color: "text-red-500",
              },
            ].map((statusBtn) => {
              const isSelected = orderStatusFilter === statusBtn.id;
              const displayCount = isBn ? statusBtn.count.toLocaleString("bn-BD") : statusBtn.count;
              return (
                <button
                  key={statusBtn.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(statusBtn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-button-bg text-button-fg shadow-xs scale-102"
                      : "hover:bg-primary/10 text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <span>{statusBtn.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? "bg-white/20 text-button-fg"
                        : "bg-foreground/10 text-foreground/80"
                    }`}
                  >
                    {displayCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveOrderQuery(orderSearch);
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder={isBn ? "অর্ডার অনুসন্ধান করুন..." : "Search orders..."}
            className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            {isBn ? "খুঁজুন" : "Search"}
          </button>
          {(activeOrderQuery || orderSearch) && (
            <button
              type="button"
              onClick={() => {
                setOrderSearch("");
                setActiveOrderQuery("");
              }}
              className="text-[10px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
            >
              {isBn ? "মুছুন" : "Clear"}
            </button>
          )}
        </form>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                <th className="py-3 px-2">{isBn ? "অর্ডার আইডি" : "Order ID"}</th>
                <th className="py-3 px-2">{isBn ? "গ্রাহক" : "Customer"}</th>
                <th className="py-3 px-2">{isBn ? "অর্ডারের তারিখ" : "Date Placed"}</th>
                <th className="py-3 px-2">{isBn ? "পেমেন্ট মাধ্যম" : "Method"}</th>
                <th className="py-3 px-2">{isBn ? "পণ্যের সংখ্যা" : "Items Count"}</th>
                <th className="py-3 px-2">{isBn ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}</th>
                <th className="py-3 px-2 text-right">{isBn ? "কার্যক্রম" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10 text-xs font-bold">
              {filteredOrders.map((order) => {
                const itemCount = order.items
                  ? order.items.reduce((sum, i) => sum + i.quantity, 0)
                  : 0;

                const displayOrderId = isBn ? order.id.toLocaleString("bn-BD") : order.id;
                const displayItemCount = isBn ? `${itemCount.toLocaleString("bn-BD")} টি` : `${itemCount} item(s)`;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-primary/5 dark:hover:bg-primary/30 transition-colors"
                  >
                    <td className="py-3.5 px-2 font-black">
                      {isBn ? `অর্ডার #${displayOrderId}` : `Order #${order.id}`}
                    </td>
                    <td className="py-3.5 px-2 opacity-90 font-bold">
                      {order.customer_name || (isBn ? `গ্রাহক #${order.customer}` : `Customer #${order.customer}`)}
                    </td>
                    <td className="py-3.5 px-2 opacity-60 text-[11px]">
                      {order.placed_at
                        ? new Date(order.placed_at).toLocaleDateString(isBn ? "bn-BD" : "en-US")
                        : "N/A"}
                    </td>
                    <td className="py-3.5 px-2">
                      {order.payment_method === "V" ? (
                        <span className="text-accent font-black uppercase inline-flex items-center gap-1 text-[11px]">
                          <img
                            src="/VibeCoin/VibeCoin.png"
                            alt="VibeCoin"
                            className="w-3.5 h-3.5 object-contain"
                          />{" "}
                          VibeCoin
                        </span>
                      ) : order.payment_method === "B" ||
                        order.payment_method === "O" ? (
                        <span className="text-bkash font-black uppercase text-[11px]">
                          bKash
                        </span>
                      ) : order.payment_method === "N" ? (
                        <span className="text-nagad font-black uppercase text-[11px]">
                          Nagad
                        </span>
                      ) : (
                        <span className="opacity-80 font-bold uppercase text-[11px]">
                          COD
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">{displayItemCount}</td>
                    <td className="py-3.5 px-2">
                      <select
                        value={order.payment_status || "P"}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider outline-none cursor-pointer border ${
                          order.payment_status === "C"
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : order.payment_status === "F"
                              ? "bg-red-500/20 text-red-500 border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                        }`}
                      >
                        <option
                          value="P"
                          className="bg-secondary text-foreground"
                        >
                          {isBn ? "পেন্ডিং (P)" : "Pending (P)"}
                        </option>
                        <option
                          value="C"
                          className="bg-secondary text-foreground"
                        >
                          {isBn ? "কমপ্লিট (C)" : "Complete (C)"}
                        </option>
                        <option
                          value="F"
                          className="bg-secondary text-foreground"
                        >
                          {isBn ? "ফেইল্ড / বাতিল (F)" : "Failed (F)"}
                        </option>
                      </select>
                    </td>
                    <td className="py-3.5 px-2 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="px-3 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {isBn ? "বিস্তারিত দেখুন" : "View Details"}
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {isBn ? "মুছুন" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
          {isBn ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found."}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-foreground/10 relative">
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {isBn
                    ? `অর্ডার #${selectedOrderDetails.id.toLocaleString("bn-BD")}`
                    : `Order #${selectedOrderDetails.id}`}
                </h3>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                  {isBn
                    ? `গ্রাহক #${selectedOrderDetails.customer.toLocaleString("bn-BD")} • `
                    : `Customer #${selectedOrderDetails.customer} • `}
                  {selectedOrderDetails.placed_at
                    ? new Date(
                        selectedOrderDetails.placed_at
                      ).toLocaleString(isBn ? "bn-BD" : "en-US")
                    : ""}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>

            {/* Customer Contact & Address Info */}
            <div className="bg-primary/5 dark:bg-primary/30 p-4 rounded-2xl mb-6 text-xs space-y-1.5">
              <p>
                <strong>{isBn ? "মোবাইল নম্বর:" : "Phone:"}</strong> {selectedOrderDetails.phone || (isBn ? "নেই" : "N/A")}
              </p>
              <p>
                <strong>{isBn ? "ডেলিভারি ঠিকানা:" : "Shipping Address:"}</strong>{" "}
                {selectedOrderDetails.shipping_address || (isBn ? "নেই" : "N/A")}
              </p>
              <p>
                <strong>{isBn ? "ডেলিভারি এলাকা:" : "Delivery Zone:"}</strong>{" "}
                <span className="font-black text-accent uppercase">
                  {selectedOrderDetails.delivery_area === "outside_dhaka"
                    ? (isBn ? "ঢাকার বাইরে" : "Outside Dhaka")
                    : (isBn ? "ঢাকার ভিতরে" : "Inside Dhaka")}
                </span>
                {selectedOrderDetails.delivery_charge !== undefined && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-secondary border border-foreground/10 text-[10px] font-bold">
                    {isBn ? "ডেলিভারি ফি: " : "Delivery Fee: "}
                    {formatCurrency(selectedOrderDetails.delivery_charge)}
                  </span>
                )}
              </p>
              <p>
                <strong>{isBn ? "পেমেন্ট পদ্ধতি:" : "Payment Method:"}</strong>{" "}
                {selectedOrderDetails.payment_method === "V" ? (
                  <span className="text-accent font-black uppercase inline-flex items-center gap-1">
                    <img
                      src="/VibeCoin/VibeCoin.png"
                      alt="VibeCoin"
                      className="w-3.5 h-3.5 object-contain"
                    />{" "}
                    {isBn ? "ভাইবকয়েন পেমেন্ট" : "VibeCoin Payment"}
                  </span>
                ) : selectedOrderDetails.payment_method === "O" ||
                  selectedOrderDetails.payment_method === "B" ? (
                  <span className="text-bkash font-black uppercase">
                    {isBn ? "বিকাশ পেমেন্ট" : "Online / bKash Payment"}
                  </span>
                ) : selectedOrderDetails.payment_method === "N" ? (
                  <span className="text-nagad font-black uppercase">
                    {isBn ? "নগদ পেমেন্ট" : "Nagad Payment"}
                  </span>
                ) : (
                  <span className="font-black uppercase">
                    {isBn ? "ক্যাশ অন ডেলিভারি (সিওডি)" : "Cash on Delivery (COD)"}
                  </span>
                )}
              </p>
              {(selectedOrderDetails.payment_method === "O" ||
                selectedOrderDetails.payment_method === "B") && (
                <p>
                  <strong>{isBn ? "বিকাশ TrxID:" : "bKash TrxID:"}</strong>{" "}
                  <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-bkash">
                    {selectedOrderDetails.transaction_id || "N/A"}
                  </code>{" "}
                  {selectedOrderDetails.transaction_phone_no
                    ? `[${isBn ? "প্রেরক" : "Sender"}: ${selectedOrderDetails.transaction_phone_no}]`
                    : ""}
                </p>
              )}
              {selectedOrderDetails.payment_method === "N" && (
                <p>
                  <strong>{isBn ? "নগদ TrxID:" : "Nagad TrxID:"}</strong>{" "}
                  <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-nagad">
                    {selectedOrderDetails.transaction_id || "N/A"}
                  </code>{" "}
                  {selectedOrderDetails.transaction_phone_no
                    ? `[${isBn ? "প্রেরক" : "Sender"}: ${selectedOrderDetails.transaction_phone_no}]`
                    : ""}
                </p>
              )}
            </div>

            {/* Order Items Table */}
            <div className="max-h-60 overflow-y-auto mb-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-foreground/10 text-[10px] font-black uppercase opacity-60">
                    <th className="py-2 px-1">{isBn ? "পণ্য" : "Product"}</th>
                    <th className="py-2 px-1">{isBn ? "পরিমাণ" : "Qty"}</th>
                    <th className="py-2 px-1">{isBn ? "একক মূল্য" : "Unit Price"}</th>
                    <th className="py-2 px-1 text-right">{isBn ? "মোট মূল্য" : "Subtotal"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {selectedOrderDetails.items &&
                  selectedOrderDetails.items.length > 0 ? (
                    selectedOrderDetails.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-1 font-bold">
                          <div>
                            {item.product?.title || (isBn ? `পণ্য #${item.product}` : `Product #${item.product}`)}
                          </div>
                          {(item.variant || item.variant_title) && (
                            <div className="text-[10px] text-accent font-semibold flex items-center gap-1 mt-0.5">
                              {item.variant?.color_code && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shrink-0"
                                  style={{
                                    backgroundColor: item.variant.color_code,
                                  }}
                                />
                              )}
                              <span>
                                {isBn ? "ভেরিয়েন্ট: " : "Option: "}
                                {item.variant?.name || item.variant_title}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          {isBn ? `${item.quantity.toLocaleString("bn-BD")} টি` : item.quantity}
                        </td>
                        <td className="py-2 px-1">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-2 px-1 text-right font-black text-accent">
                          {formatCurrency(item.quantity * Number(item.unit_price))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-xs opacity-50"
                      >
                        {isBn ? "পণ্যের বিবরণ পাওয়া যায়নি।" : "No item breakdown available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-foreground/10 space-y-2">
              <div className="flex justify-between text-xs opacity-75">
                <span>{isBn ? "পণ্যের সাবটোটাল:" : "Items Subtotal:"}</span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedOrderDetails.items
                      ? selectedOrderDetails.items.reduce(
                          (sum, i) => sum + i.quantity * Number(i.unit_price),
                          0
                        )
                      : 0
                  )}
                </span>
              </div>
              {selectedOrderDetails.delivery_charge !== undefined && (
                <div className="flex justify-between text-xs opacity-75">
                  <span>
                    {isBn ? "ডেলিভারি চার্জ (" : "Delivery Charge ("}
                    {selectedOrderDetails.delivery_area === "outside_dhaka"
                      ? (isBn ? "ঢাকার বাইরে" : "Outside Dhaka")
                      : (isBn ? "ঢাকার ভিতরে" : "Inside Dhaka")}
                    ):
                  </span>
                  <span className="font-bold">
                    {formatCurrency(selectedOrderDetails.delivery_charge)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-foreground/10">
                <span className="text-xs font-bold opacity-70 uppercase">
                  {isBn ? "পেমেন্ট অবস্থা: " : "Payment Status: "}
                  <strong className="uppercase font-black text-foreground">
                    {selectedOrderDetails.payment_status === "C"
                      ? (isBn ? "সফল (Complete)" : "Complete")
                      : selectedOrderDetails.payment_status === "F"
                        ? (isBn ? "ব্যর্থ (Failed)" : "Failed")
                        : (isBn ? "পেন্ডিং (Pending)" : "Pending")}
                  </strong>
                </span>
                <span className="text-base font-black text-foreground">
                  {isBn ? "সর্বমোট মূল্য: " : "Grand Total: "}
                  {formatCurrency(
                    (selectedOrderDetails.items
                      ? selectedOrderDetails.items.reduce(
                          (sum, i) =>
                            sum + i.quantity * Number(i.unit_price),
                          0
                        )
                      : 0) +
                    Number(selectedOrderDetails.delivery_charge || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

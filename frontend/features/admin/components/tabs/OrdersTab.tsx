import { useState, useEffect } from "react";
import { Order, OrderItem, Product, CourierProvider } from "../../types";
import { useLanguage } from "@/store/LanguageContext";
import Image from "next/image";

const PRESET_COURIERS: Record<string, { logo: string }> = {
  steadfast: { logo: "/DeliveryPartner/steadfast.jpg" },
  pathao: { logo: "/DeliveryPartner/pathaocourier.png" },
  redX: { logo: "/DeliveryPartner/redx.png" },
  redx: { logo: "/DeliveryPartner/redx.png" },
  paperfly: { logo: "/DeliveryPartner/paperfly.png" },
};

interface OrdersTabProps {
  orders: Order[];
  productsCatalog?: Product[];
  courierProviders?: CourierProvider[];

  handleUpdateOrderStatus: (orderId: number, status: string) => Promise<void>;
  handleSaveEditedOrder?: (
    orderId: number,
    payload: {
      shipping_address?: string;
      phone?: string;
      delivery_area?: string;
      delivery_charge?: number;
      payment_status?: string;
      items: Array<{
        id?: number;
        product_id: number;
        variant_id?: number | null;
        quantity: number;
        unit_price?: number;
      }>;
    }
  ) => Promise<boolean>;
  handleDeleteOrder: (orderId: number) => Promise<void>;
  handleDispatchOrderCourier?: (
    orderId: number,
    payload: {
      courier_id?: number | null;
      tracking_code?: string;
      tracking_status?: string;
    }
  ) => Promise<boolean>;
  handleUpdateOrderTracking?: (
    orderId: number,
    payload: {
      tracking_code?: string;
      tracking_status?: string;
    }
  ) => Promise<boolean>;
  targetOrderId?: string | null;
}

interface EditableItem {
  id?: number;
  product_id: number;
  product_title: string;
  product_image?: string;
  variant_id?: number | null;
  variant_name?: string;
  variant_color_code?: string;
  quantity: number;
  unit_price: number;
}

export default function OrdersTab({
  orders,
  productsCatalog = [],
  courierProviders = [],
  handleUpdateOrderStatus,
  handleSaveEditedOrder,
  handleDeleteOrder,
  handleDispatchOrderCourier,
  handleUpdateOrderTracking,
  targetOrderId = null,
}: OrdersTabProps) {
  const { locale, formatCurrency, t } = useLanguage();
  const isBn = locale === "bn";

  const [orderSearch, setOrderSearch] = useState("");
  const [activeOrderQuery, setActiveOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | "P" | "F" | "C"
  >("ALL");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(
    null
  );

  // Dispatch / Track Modal State
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<number | "manual">("manual");
  const [trackingCodeInput, setTrackingCodeInput] = useState("");
  const [trackingStatusInput, setTrackingStatusInput] = useState<
    "pending" | "packed" | "in_transit" | "out_for_delivery" | "delivered" | "returned"
  >("in_transit");
  const [isDispatching, setIsDispatching] = useState(false);

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editShippingAddress, setEditShippingAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDeliveryArea, setEditDeliveryArea] = useState("inside_dhaka");
  const [editDeliveryCharge, setEditDeliveryCharge] = useState<number>(60);
  const [editPaymentStatus, setEditPaymentStatus] = useState("P");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Add Item to Order State inside Edit Modal
  const [selectedAddProductId, setSelectedAddProductId] = useState<number | "">("");
  const [selectedAddVariantId, setSelectedAddVariantId] = useState<number | "">("");
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addCustomPrice, setAddCustomPrice] = useState<string>("");
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");

  const activeCouriers = courierProviders.filter((p) => p.is_active);


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
                      <div className="space-y-1">
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

                        {/* Courier / Tracking Status Badge */}
                        {order.tracking_code ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                order.tracking_status === "delivered"
                                  ? "bg-visible/15 text-visible"
                                  : order.tracking_status === "returned"
                                    ? "bg-hidden/15 text-hidden"
                                    : "bg-accent/15 text-accent"
                              }`}
                            >
                              {order.courier_partner_details?.name || "Manual"}: {order.tracking_status_display || order.tracking_status}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right flex justify-end items-center gap-2">
                      {/* Dispatch / Track Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchOrder(order);
                          setSelectedCourierId(order.courier_partner || (activeCouriers.length > 0 ? activeCouriers[0].id : "manual"));
                          setTrackingCodeInput(order.tracking_code || "");
                          setTrackingStatusInput(
                            (order.tracking_status as any) || "in_transit"
                          );
                        }}
                        className="px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        title={t("admin.delivery.dispatchBtn")}
                      >
                        {t("admin.delivery.dispatchBtn")}
                      </button>

                      {order.payment_method === "C" ? (
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setEditShippingAddress(order.shipping_address || "");
                            setEditPhone(order.phone || "");
                            setEditDeliveryArea(order.delivery_area || "inside_dhaka");
                            setEditDeliveryCharge(Number(order.delivery_charge) || 60);
                            setEditPaymentStatus(order.payment_status || "P");
                            setEditItems(
                              order.items
                                ? order.items.map((i) => ({
                                    id: i.id,
                                    product_id: i.product?.id || 0,
                                    product_title: i.product?.title || `Product #${i.product}`,
                                    product_image: i.product?.images?.[0]?.image,
                                    variant_id: i.variant?.id || null,
                                    variant_name: i.variant?.name || i.variant_title,
                                    variant_color_code: i.variant?.color_code,
                                    quantity: i.quantity,
                                    unit_price: Number(i.unit_price),
                                  }))
                                : []
                            );
                            setSelectedAddProductId("");
                            setSelectedAddVariantId("");
                            setAddQuantity(1);
                            setAddCustomPrice("");
                          }}
                          className="px-3 py-1.5 bg-accent text-white hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {isBn ? "সম্পাদনা" : "Edit"}
                        </button>
                      ) : null}
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

              {/* Courier & Tracking Summary Section */}
              <div className="pt-3 border-t border-foreground/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60 block">
                    {t("admin.delivery.trackingHistory")}
                  </span>
                  {selectedOrderDetails.tracking_code ? (
                    <div className="text-xs font-bold mt-0.5 flex items-center gap-2">
                      <span className="text-accent">{selectedOrderDetails.courier_partner_details?.name || "Manual Tracking"}:</span>
                      <code className="font-mono bg-background px-2 py-0.5 rounded border border-foreground/10">
                        {selectedOrderDetails.tracking_code}
                      </code>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-visible/15 text-visible rounded-md">
                        {selectedOrderDetails.tracking_status_display || selectedOrderDetails.tracking_status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs opacity-60 font-medium">
                      {isBn ? "কোনো কুরিয়ার যুক্ত করা হয়নি" : "Not yet dispatched to courier"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderDetails;
                    setSelectedOrderDetails(null);
                    setDispatchOrder(ord);
                    setSelectedCourierId(ord.courier_partner || (activeCouriers.length > 0 ? activeCouriers[0].id : "manual"));
                    setTrackingCodeInput(ord.tracking_code || "");
                    setTrackingStatusInput((ord.tracking_status as any) || "in_transit");
                  }}
                  className="px-3.5 py-1.5 bg-accent text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t("admin.delivery.dispatchBtn")}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal (COD Only) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-secondary text-foreground rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-foreground/10 relative my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-tight">
                    {isBn
                      ? `অর্ডার #${editingOrder.id.toLocaleString("bn-BD")} সম্পাদনা`
                      : `Edit Order #${editingOrder.id}`}
                  </h3>
                  <span className="bg-accent/20 text-accent text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    COD
                  </span>
                  {editingOrder.is_edited_by_admin && (
                    <span className="bg-primary/10 text-foreground/70 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {isBn ? "ইতিপূর্বে সংশোধিত" : "Previously Edited"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">
                  {isBn
                    ? "পণ্য যোগ/বাদ দিন, পরিমাণ পরিবর্তন করুন এবং অর্ডার আপডেট করুন।"
                    : "Add/remove products, adjust quantities, and update order details."}
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Order Items Table & Management */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn ? "অর্ডারের পণ্যসমূহ" : "Order Items"} ({editItems.length})
                  </label>
                  <span className="text-[10px] text-accent font-bold">
                    {isBn ? "সর্বনিম্ন ১টি পণ্য থাকতে হবে" : "At least 1 item required"}
                  </span>
                </div>

                <div className="space-y-2">
                  {editItems.map((item, idx) => {
                    const itemSubtotal = item.quantity * item.unit_price;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-primary/5 dark:bg-primary/20 rounded-2xl border border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product_image ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-foreground/10 bg-secondary shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.product_image}
                                alt={item.product_title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center text-xs shrink-0">
                              #
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {item.product_title}
                            </p>
                            {item.variant_name && (
                              <div className="flex items-center gap-1.5 text-[10px] text-accent font-semibold mt-0.5">
                                {item.variant_color_code && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                    style={{
                                      backgroundColor: item.variant_color_code,
                                    }}
                                  />
                                )}
                                <span>{item.variant_name}</span>
                              </div>
                            )}
                            <p className="text-[10px] opacity-60">
                              {formatCurrency(item.unit_price)} / {isBn ? "প্রতি একক" : "unit"}
                            </p>
                          </div>
                        </div>

                        {/* Quantity controls & delete */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="flex items-center border border-foreground/20 rounded-xl overflow-hidden bg-secondary">
                            <button
                              type="button"
                              onClick={() => {
                                setEditItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx
                                      ? { ...it, quantity: Math.max(1, it.quantity - 1) }
                                      : it
                                  )
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-black hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setEditItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx
                                      ? { ...it, quantity: Math.max(1, val) }
                                      : it
                                  )
                                );
                              }}
                              className="w-12 text-center font-bold text-xs bg-transparent outline-none py-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx
                                      ? { ...it, quantity: it.quantity + 1 }
                                      : it
                                  )
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-black hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <p className="font-black text-accent">
                              {formatCurrency(itemSubtotal)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (editItems.length <= 1) {
                                return;
                              }
                              setEditItems((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            disabled={editItems.length <= 1}
                            title={
                              editItems.length <= 1
                                ? isBn
                                  ? "কমপক্ষে ১টি পণ্য রাখা আবশ্যক"
                                  : "At least 1 item required"
                                : undefined
                            }
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Product to Order Section */}
              <div className="p-4 rounded-2xl border border-dashed border-foreground/20 bg-primary/5 dark:bg-primary/20 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "+ অর্ডারে নতুন পণ্য যোগ করুন" : "+ Add Product to Order"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Product */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase opacity-60">
                      {isBn ? "পণ্য নির্বাচন করুন" : "Select Product"}
                    </label>
                    <select
                      value={selectedAddProductId}
                      onChange={(e) => {
                        const pid = Number(e.target.value) || "";
                        setSelectedAddProductId(pid);
                        setSelectedAddVariantId("");
                        setAddCustomPrice("");
                      }}
                      className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent"
                    >
                      <option value="">{isBn ? "-- পণ্য নির্বাচন করুন --" : "-- Select a product --"}</option>
                      {productsCatalog.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.id} {p.title} (৳{Number(p.unit_price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Variant if available */}
                  {(() => {
                    const selectedProd = productsCatalog.find(
                      (p) => p.id === selectedAddProductId
                    );
                    const variants = (selectedProd as any)?.variants || [];
                    return (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase opacity-60">
                          {isBn ? "ভেরিয়েন্ট (ঐচ্ছিক)" : "Option / Variant (Optional)"}
                        </label>
                        <select
                          value={selectedAddVariantId}
                          disabled={variants.length === 0}
                          onChange={(e) => {
                            const vid = Number(e.target.value) || "";
                            setSelectedAddVariantId(vid);
                          }}
                          className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent disabled:opacity-40"
                        >
                          <option value="">
                            {variants.length > 0
                              ? isBn
                                ? "-- মূল পণ্য (ডিফল্ট) --"
                                : "-- Base Product (Default) --"
                              : isBn
                              ? "কোনো ভ্যারিয়েন্ট নেই"
                              : "No variants available"}
                          </option>
                          {variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.name} {v.price_override ? `(৳${Number(v.price_override).toFixed(2)})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase opacity-60">
                      {isBn ? "পরিমাণ" : "Quantity"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase opacity-60">
                      {isBn ? "একক মূল্য (৳)" : "Unit Price (৳)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={
                        (() => {
                          const p = productsCatalog.find((x) => x.id === selectedAddProductId);
                          if (!p) return "Auto";
                          const variants = (p as any)?.variants || [];
                          const v = variants.find((x: any) => x.id === selectedAddVariantId);
                          if (v && v.price_override) return String(v.price_override);
                          return String(p.unit_price);
                        })()
                      }
                      value={addCustomPrice}
                      onChange={(e) => setAddCustomPrice(e.target.value)}
                      className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!selectedAddProductId}
                    onClick={() => {
                      const prod = productsCatalog.find((p) => p.id === selectedAddProductId);
                      if (!prod) return;
                      const variants = (prod as any)?.variants || [];
                      const variant = variants.find((v: any) => v.id === selectedAddVariantId);

                      let unitPrice = Number(prod.unit_price);
                      if (addCustomPrice && !isNaN(parseFloat(addCustomPrice))) {
                        unitPrice = parseFloat(addCustomPrice);
                      } else if (variant && variant.price_override) {
                        unitPrice = Number(variant.price_override);
                      }

                      // Check if already in editItems with same product and variant
                      const existingIdx = editItems.findIndex(
                        (it) =>
                          it.product_id === prod.id &&
                          (variant ? it.variant_id === variant.id : !it.variant_id)
                      );

                      if (existingIdx >= 0) {
                        setEditItems((prev) =>
                          prev.map((it, i) =>
                            i === existingIdx
                              ? { ...it, quantity: it.quantity + addQuantity }
                              : it
                          )
                        );
                      } else {
                        setEditItems((prev) => [
                          ...prev,
                          {
                            product_id: prod.id,
                            product_title: prod.title,
                            product_image: prod.images?.[0]?.image,
                            variant_id: variant?.id || null,
                            variant_name: variant?.name,
                            variant_color_code: variant?.color_code,
                            quantity: addQuantity,
                            unit_price: unitPrice,
                          },
                        ]);
                      }

                      // Reset add form
                      setSelectedAddProductId("");
                      setSelectedAddVariantId("");
                      setAddQuantity(1);
                      setAddCustomPrice("");
                    }}
                    className="px-4 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isBn ? "+ অর্ডারে যোগ করুন" : "+ Add to Order"}
                  </button>
                </div>
              </div>

              {/* Shipping & Delivery Address Adjustments */}
              <div className="space-y-3 pt-3 border-t border-foreground/10">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "ডেলিভারি ও যোগাযোগের তথ্য" : "Shipping & Contact Details"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase opacity-60">
                      {isBn ? "মোবাইল নম্বর" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase opacity-60">
                      {isBn ? "ডেলিভারি এলাকা ও চার্জ" : "Delivery Area & Fee"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editDeliveryArea}
                        onChange={(e) => {
                          const area = e.target.value;
                          setEditDeliveryArea(area);
                          setEditDeliveryCharge(area === "outside_dhaka" ? 120 : 60);
                        }}
                        className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent"
                      >
                        <option value="inside_dhaka">{isBn ? "ঢাকার ভিতরে" : "Inside Dhaka"}</option>
                        <option value="outside_dhaka">{isBn ? "ঢাকার বাইরে" : "Outside Dhaka"}</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={editDeliveryCharge}
                        onChange={(e) => setEditDeliveryCharge(parseFloat(e.target.value) || 0)}
                        className="px-3 py-2 border border-foreground/15 rounded-xl bg-secondary text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase opacity-60">
                    {isBn ? "ডেলিভারি ঠিকানা" : "Shipping Address"}
                  </label>
                  <input
                    type="text"
                    value={editShippingAddress}
                    onChange={(e) => setEditShippingAddress(e.target.value)}
                    placeholder={isBn ? "বাড়ি নং, রোড নং, এলাকা, জেলা" : "Full street address, area, district"}
                    className="px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Footer / Total & Actions */}
            <div className="pt-4 mt-4 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs font-black">
                <div>
                  <span className="opacity-60 text-[10px] uppercase block">
                    {isBn ? "পণ্যের মোট মূল্য" : "Items Subtotal"}
                  </span>
                  <span>
                    {formatCurrency(
                      editItems.reduce((acc, it) => acc + it.quantity * it.unit_price, 0)
                    )}
                  </span>
                </div>
                <span>+</span>
                <div>
                  <span className="opacity-60 text-[10px] uppercase block">
                    {isBn ? "ডেলিভারি ফি" : "Delivery"}
                  </span>
                  <span>{formatCurrency(editDeliveryCharge)}</span>
                </div>
                <span>=</span>
                <div>
                  <span className="opacity-60 text-[10px] uppercase block">
                    {isBn ? "সর্বমোট" : "Grand Total"}
                  </span>
                  <span className="text-base text-accent">
                    {formatCurrency(
                      editItems.reduce((acc, it) => acc + it.quantity * it.unit_price, 0) +
                        editDeliveryCharge
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-foreground/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={isSavingOrder || editItems.length === 0}
                  onClick={async () => {
                    if (!handleSaveEditedOrder || !editingOrder) return;
                    setIsSavingOrder(true);
                    const success = await handleSaveEditedOrder(editingOrder.id, {
                      shipping_address: editShippingAddress,
                      phone: editPhone,
                      delivery_area: editDeliveryArea,
                      delivery_charge: editDeliveryCharge,
                      payment_status: editPaymentStatus,
                      items: editItems.map((it) => ({
                        id: it.id,
                        product_id: it.product_id,
                        variant_id: it.variant_id || null,
                        quantity: it.quantity,
                        unit_price: it.unit_price,
                      })),
                    });
                    setIsSavingOrder(false);
                    if (success) {
                      setEditingOrder(null);
                    }
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md disabled:opacity-40 cursor-pointer"
                >
                  {isSavingOrder
                    ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                    : (isBn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH / PARCEL TRACKING MODAL */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-secondary text-foreground rounded-3xl p-6 sm:p-8 border border-foreground/15 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                  {t("admin.delivery.dispatchTitle")}
                </h3>
                <p className="text-xs opacity-60 mt-0.5">
                  {isBn
                    ? `অর্ডার #${dispatchOrder.id.toLocaleString("bn-BD")} • ${dispatchOrder.customer_name || "গ্রাহক"}`
                    : `Order #${dispatchOrder.id} • ${dispatchOrder.customer_name || "Customer"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {t("admin.delivery.cancelBtn")}
              </button>
            </div>

            {/* Recipient Snapshot Box */}
            <div className="p-4 rounded-2xl bg-background border border-foreground/10 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? "ঠিকানা:" : "Address:"}</span>
                <span className="font-bold text-right truncate max-w-[220px]">
                  {dispatchOrder.shipping_address || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{isBn ? "মোবাইল:" : "Phone:"}</span>
                <span className="font-bold">{dispatchOrder.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-foreground/5">
                <span className="opacity-60">{isBn ? "সিওডি / বিলের পরিমাণ:" : "COD / Amount:"}</span>
                <span className="font-black text-accent">
                  {formatCurrency(
                    (dispatchOrder.items
                      ? dispatchOrder.items.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0)
                      : 0) + Number(dispatchOrder.delivery_charge || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Courier Provider Choice */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {t("admin.delivery.selectCourier")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeCouriers.map((cp) => {
                  const isSelected = selectedCourierId === cp.id;
                  const logo = PRESET_COURIERS[cp.provider_code]?.logo || "/DeliveryPartner/steadfast.jpg";
                  return (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => setSelectedCourierId(cp.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-accent/15 border-accent text-accent shadow-xs"
                          : "bg-background border-foreground/10 text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <div className="w-9 h-9 relative rounded-xl overflow-hidden bg-white shrink-0 p-1 flex items-center justify-center border border-foreground/10">
                        <Image
                          src={logo}
                          alt={cp.name}
                          fill
                          sizes="36px"
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{cp.name}</div>
                        <div className="text-[9px] opacity-60 uppercase tracking-wider font-bold">
                          {cp.provider_code}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Manual Tracking Option */}
                <button
                  type="button"
                  onClick={() => setSelectedCourierId("manual")}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedCourierId === "manual"
                      ? "bg-accent/15 border-accent text-accent shadow-xs"
                      : "bg-background border-foreground/10 text-foreground hover:border-foreground/30"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center font-black text-xs">
                    MNL
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">{t("admin.delivery.manualTrackingOption")}</div>
                    <div className="text-[9px] opacity-60 uppercase tracking-wider font-bold">
                      In-House
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tracking Code Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                {t("admin.delivery.trackingCode")}
              </label>
              <input
                type="text"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                placeholder={t("admin.delivery.trackingCodePlaceholder")}
                className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Tracking Status Milestones */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                {t("admin.delivery.trackingStatus")}
              </label>
              <select
                value={trackingStatusInput}
                onChange={(e) => setTrackingStatusInput(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              >
                <option value="pending">{t("admin.delivery.statusPending")}</option>
                <option value="packed">{t("admin.delivery.statusPacked")}</option>
                <option value="in_transit">{t("admin.delivery.statusInTransit")}</option>
                <option value="out_for_delivery">{t("admin.delivery.statusOutForDelivery")}</option>
                <option value="delivered">{t("admin.delivery.statusDelivered")}</option>
                <option value="returned">{t("admin.delivery.statusReturned")}</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="px-5 py-2.5 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:bg-foreground/5 transition-all cursor-pointer"
              >
                {t("admin.delivery.cancelBtn")}
              </button>

              <button
                type="button"
                disabled={isDispatching}
                onClick={async () => {
                  if (!dispatchOrder) return;
                  setIsDispatching(true);

                  if (handleDispatchOrderCourier) {
                    const payload = {
                      courier_id: selectedCourierId === "manual" ? null : Number(selectedCourierId),
                      tracking_code: trackingCodeInput,
                      tracking_status: trackingStatusInput,
                    };
                    const success = await handleDispatchOrderCourier(dispatchOrder.id, payload);
                    if (success) {
                      setDispatchOrder(null);
                    }
                  } else if (handleUpdateOrderTracking) {
                    const success = await handleUpdateOrderTracking(dispatchOrder.id, {
                      tracking_code: trackingCodeInput,
                      tracking_status: trackingStatusInput,
                    });
                    if (success) {
                      setDispatchOrder(null);
                    }
                  }
                  setIsDispatching(false);
                }}
                className="px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDispatching ? (
                  <span>{t("admin.delivery.dispatching")}</span>
                ) : (
                  <span>
                    {dispatchOrder.tracking_code
                      ? t("admin.delivery.updateTrackingBtn")
                      : t("admin.delivery.confirmDispatch")}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

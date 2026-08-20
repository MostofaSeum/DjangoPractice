"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { ReviewItem, Product } from "../../types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ReviewsSubTabProps {
  products: Product[];
  token: string | null;
}

export default function ReviewsSubTab({ products, token }: ReviewsSubTabProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "ALL">("ALL");
  const [selectedProductId, setSelectedProductId] = useState<number | "ALL">("ALL");
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/store/reviews/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Delete review handler
  const handleDeleteReview = async (reviewId: number) => {
    const result = await Swal.fire({
      title: "Delete Review?",
      text: "Are you sure you want to permanently delete this customer review?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl bg-secondary text-foreground border border-foreground/10",
        confirmButton: "bg-red-500 text-white font-bold px-4 py-2 rounded-xl",
        cancelButton: "bg-foreground/10 text-foreground font-bold px-4 py-2 rounded-xl",
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/store/reviews/${reviewId}/`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `JWT ${token}` : "",
          },
        });
        if (res.ok || res.status === 204) {
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));
          Swal.fire({
            title: "Deleted!",
            text: "Review has been removed.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error", "Failed to delete review", "error");
        }
      } catch (err) {
        console.error("Error deleting review:", err);
        Swal.fire("Error", "An unexpected error occurred", "error");
      }
    }
  };

  // Filtered reviews based on search query, star rating, and product
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // Rating filter
      if (selectedRating !== "ALL" && rev.rating !== selectedRating) {
        return false;
      }

      // Product filter
      if (selectedProductId !== "ALL" && rev.product !== selectedProductId) {
        return false;
      }

      // Search query (customer name, review text, or product title)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rev.name?.toLowerCase().includes(q);
        const matchesDesc = rev.description?.toLowerCase().includes(q);
        const matchesProd = rev.product_title?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesProd) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, selectedRating, selectedProductId, searchQuery]);

  // Rating counts for quick filters
  const ratingCounts = useMemo(() => {
    const counts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
      }
    });
    return counts;
  }, [reviews]);

  // Helper to render star icons
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? "opacity-100" : "opacity-20 text-foreground"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-secondary text-foreground p-6 md:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-foreground/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <h2 className="text-base font-black uppercase tracking-widest text-foreground">
              Customer Reviews & Ratings
            </h2>
          </div>
          <p className="text-xs opacity-60 mt-1">
            Browse, search, sort by rating, and manage customer reviews for all catalog products.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="px-4 py-2 bg-primary/5 hover:bg-primary/10 dark:bg-primary/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer border border-foreground/10"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Reviews
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Star Rating Sorter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-primary/5 dark:bg-primary/30 rounded-2xl border border-foreground/10">
          <button
            onClick={() => setSelectedRating("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedRating === "ALL"
                ? "bg-button-bg text-button-fg shadow-xs"
                : "opacity-60 hover:opacity-100 hover:bg-foreground/5"
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setSelectedRating(stars)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                selectedRating === stars
                  ? "bg-button-bg text-button-fg shadow-xs"
                  : "opacity-60 hover:opacity-100 hover:bg-foreground/5"
              }`}
            >
              <span>{stars}★</span>
              <span className="text-[10px] opacity-75">({ratingCounts[stars] || 0})</span>
            </button>
          ))}
        </div>

        {/* Product Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Select by Product */}
          <select
            value={selectedProductId}
            onChange={(e) =>
              setSelectedProductId(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent transition-all"
          >
            <option value="ALL" className="bg-secondary text-foreground">
              All Products ({products.length})
            </option>
            {products.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-secondary text-foreground"
              >
                {p.title}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, customer, text..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-3 text-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs font-black opacity-50 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List / Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold opacity-60">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-foreground/15 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-xl">
              💬
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
              No Reviews Found
            </h4>
            <p className="text-xs opacity-60 max-w-sm">
              {searchQuery || selectedRating !== "ALL" || selectedProductId !== "ALL"
                ? "No reviews match the selected filter or search criteria."
                : "No customer reviews have been submitted for any product yet."}
            </p>
            {(searchQuery || selectedRating !== "ALL" || selectedProductId !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRating("ALL");
                  setSelectedProductId("ALL");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between hover:border-foreground/20 transition-all group"
              >
                <div>
                  {/* Card Header: Rating, Date, Delete Button */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      {renderStars(rev.rating)}
                      <span className="text-[10px] opacity-50 block mt-1 font-semibold">
                        {rev.date
                          ? new Date(rev.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      title="Delete Review"
                      className="opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity p-1 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Product Badge */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 dark:bg-primary/25 border border-foreground/10 text-[11px] font-bold text-accent truncate max-w-full">
                      <span>🏷️</span>
                      <span className="truncate">{rev.product_title || `Product #${rev.product}`}</span>
                    </span>
                  </div>

                  {/* Review Description */}
                  <p className="mt-3 text-xs text-foreground/80 leading-relaxed font-medium">
                    "{rev.description}"
                  </p>

                  {/* Review Attached Images */}
                  {((rev.images && rev.images.length > 0) || rev.image) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rev.image && (
                        <div
                          onClick={() => setSelectedImagePreview(rev.image || null)}
                          className="w-12 h-12 rounded-xl overflow-hidden border border-foreground/15 relative cursor-pointer hover:scale-105 transition-transform"
                        >
                          <Image
                            src={rev.image}
                            alt="Review photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      {rev.images?.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImagePreview(img.image)}
                          className="w-12 h-12 rounded-xl overflow-hidden border border-foreground/15 relative cursor-pointer hover:scale-105 transition-transform"
                        >
                          <Image
                            src={img.image}
                            alt="Review photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Author Footer */}
                <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-black text-[10px] flex items-center justify-center uppercase">
                      {rev.name ? rev.name.charAt(0) : "U"}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {rev.name || "Anonymous Customer"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold opacity-40">
                    ID #{rev.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImagePreview && (
        <div
          onClick={() => setSelectedImagePreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-[60vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <Image
              src={selectedImagePreview}
              alt="Review Full Preview"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

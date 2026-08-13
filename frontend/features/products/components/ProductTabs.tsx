"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";

interface Review {
  id: number;
  name: string;
  description: string;
  rating?: number;
  date: string;
}

interface ProductTabsProps {
  productId: number;
  description?: string;
}

export default function ProductTabs({
  productId,
  description,
}: ProductTabsProps) {
  const { user, token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [reviewsFetched, setReviewsFetched] = useState<boolean>(false);
  const [reviewText, setReviewText] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(
        `${apiBaseUrl}/store/products/${productId}/reviews/`,
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
      setReviewsFetched(true);
    }
  }, [productId]);

  useEffect(() => {
    // Fetch initial reviews count on mount
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !user) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: "You must be signed in to post a review.",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
      return;
    }

    if (!reviewText.trim()) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: "Please enter your review content.",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
      return;
    }

    // Auto-generate reviewer name from user profile
    const reviewerName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      user.email ||
      "Customer";

    try {
      setSubmitting(true);
      const apiBaseUrl = getApiBaseUrl();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `JWT ${token}`;
      }

      const res = await fetch(
        `${apiBaseUrl}/store/products/${productId}/reviews/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: reviewerName,
            description: reviewText.trim(),
            rating: rating,
          }),
        },
      );

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Thank you! Your review has been published.",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        setReviewText("");
        setRating(5);
        // Refresh reviews list
        await fetchReviews();
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: errData.detail || "Failed to submit review. Please try again.",
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Network error. Could not post review.",
        showConfirmButton: false,
        timer: 2500,
        toast: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderStars = (starRating: number = 5, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverRating || rating)
            : star <= starRating;
          return (
            <button
              key={star}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? "cursor-pointer hover:scale-110 transition-transform focus:outline-none"
                  : "cursor-default"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFilled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isFilled
                    ? "text-amber-400 fill-amber-400"
                    : "text-foreground/25"
                }`}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      user.email
    : "";

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="mt-12 sm:mt-20 border-t border-foreground/10 pt-8 sm:pt-12 transition-colors duration-300">
      {/* Tab Navigation Header */}
      <div className="flex justify-center items-center space-x-3 sm:space-x-4 border-b border-foreground/10 pb-6 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
            activeTab === "description"
              ? "bg-button-bg text-button-fg shadow-md"
              : "bg-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          }`}
          type="button"
        >
          Description
        </button>

        <button
          onClick={() => {
            setActiveTab("reviews");
            if (!reviewsFetched) fetchReviews();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 whitespace-nowrap ${
            activeTab === "reviews"
              ? "bg-button-bg text-button-fg shadow-md"
              : "bg-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          }`}
          type="button"
        >
          <span>Reviews</span>
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === "reviews"
                ? "bg-button-fg/20 text-button-fg"
                : "bg-foreground/10 text-foreground/70"
            }`}
          >
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Description */}
      {activeTab === "description" && (
        <div className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-3xl mx-auto text-center font-medium px-4">
          <p className="whitespace-pre-line">
            {description || "No description available for this product."}
          </p>
        </div>
      )}

      {/* Tab Content: Reviews */}
      {activeTab === "reviews" && (
        <div className="max-w-3xl mx-auto space-y-10 sm:space-y-12 px-2 sm:px-0">
          {/* Review List Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2 border-b border-foreground/10 pb-4">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
              Customer Reviews ({reviews.length})
            </h3>
            {avgRating && (
              <div className="flex items-center gap-2">
                {renderStars(Math.round(Number(avgRating)))}
                <span className="text-xs sm:text-sm font-extrabold text-foreground">
                  {avgRating} / 5.0
                </span>
              </div>
            )}
          </div>

          {loadingReviews && reviews.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-foreground/60 uppercase font-bold tracking-wider">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-secondary/50 border border-foreground/10 text-center">
              <p className="text-sm text-foreground/80 font-semibold mb-1">
                No reviews yet for this product.
              </p>
              <p className="text-xs text-foreground/50">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 sm:p-6 rounded-2xl bg-secondary border border-foreground/10 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 text-accent font-black text-sm flex items-center justify-center uppercase shrink-0">
                        {rev.name ? rev.name.charAt(0) : "U"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground capitalize">
                          {rev.name}
                        </h4>
                        <div className="mt-0.5">
                          {renderStars(rev.rating || 5)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-foreground/50 font-medium self-start sm:self-auto">
                      {formatDate(rev.date)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-medium sm:pl-12">
                    {rev.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add Review Form or Auth Lock */}
          <div className="pt-8 border-t border-foreground/10">
            <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground mb-6 text-center sm:text-left">
              Write a Review
            </h4>

            {authLoading ? (
              <div className="py-4 text-xs text-foreground/50 font-bold uppercase tracking-wider text-center sm:text-left">
                Checking sign-in status...
              </div>
            ) : !user || !token ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-secondary/40 border border-foreground/10 text-center space-y-4">
                <div className="w-12 h-12 bg-accent/20 text-accent rounded-2xl mx-auto flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-tight">
                  Sign in required to post a review
                </p>
                <p className="text-xs text-foreground/70 font-medium max-w-sm mx-auto">
                  Please sign in to your account to submit a review for this
                  product.
                </p>
                <div>
                  <Link
                    href={`/login?redirect=/products/${productId}`}
                    className="inline-block px-6 sm:px-8 py-3 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                  >
                    Sign In to Review
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="space-y-4 bg-secondary/40 p-5 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm"
              >
                <div className="flex items-center gap-3 pb-2 border-b border-foreground/10">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-black text-xs flex items-center justify-center uppercase shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    Posting as{" "}
                    <span className="text-accent">{displayName}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 bg-background border border-foreground/15 rounded-xl px-4 py-2.5 w-fit">
                    {renderStars(rating, true)}
                    <span className="text-xs font-extrabold text-amber-500">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your detailed review about this product..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-semibold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  image?: string | null;
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          position: "top-end",
          icon: "warning",
          title: "Image size must be less than 5MB.",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

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
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `JWT ${token}`;
      }

      const formData = new FormData();
      formData.append("name", reviewerName);
      formData.append("description", reviewText.trim());
      formData.append("rating", String(rating));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await fetch(
        `${apiBaseUrl}/store/products/${productId}/reviews/`,
        {
          method: "POST",
          headers,
          body: formData,
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
        removeSelectedImage();
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
              type="button"
              disabled={!interactive}
              onClick={(e) => {
                if (interactive) {
                  e.preventDefault();
                  e.stopPropagation();
                  setRating(star);
                }
              }}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? "cursor-pointer hover:scale-110 transition-transform focus:outline-none p-1"
                  : "cursor-default"
              }`}
              aria-label={interactive ? `Rate ${star} star${star > 1 ? "s" : ""}` : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFilled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                className={`w-5 h-5 ${
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

  const getImageUrl = (imgUrl: string) => {
    if (!imgUrl) return "";
    if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
      return imgUrl;
    }
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
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

                  {/* Attached Photo Thumbnail */}
                  {rev.image && (
                    <div className="mt-3 sm:pl-12">
                      <button
                        type="button"
                        onClick={() => setActiveImageModal(getImageUrl(rev.image!))}
                        className="relative group overflow-hidden rounded-2xl border border-foreground/15 block"
                      >
                        <img
                          src={getImageUrl(rev.image)}
                          alt="Review Attachment"
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
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
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-3 bg-background border border-foreground/15 rounded-xl px-4 py-2.5 w-fit">
                    {renderStars(rating, true)}
                    <span className="text-xs font-extrabold text-amber-500 min-w-[75px]">
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

                {/* Attach Photo Option */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    Attach Photo
                  </label>
                  {imagePreview ? (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-foreground/20 group">
                      <img
                        src={imagePreview}
                        alt="Review preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition-colors"
                        title="Remove photo"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-background border border-dashed border-foreground/25 rounded-xl cursor-pointer hover:border-accent transition-all w-fit text-xs font-bold text-foreground/70 hover:text-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
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

      {/* Lightbox Modal for Enlarged Photo View */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={activeImageModal}
              alt="Enlarged Review Attachment"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2.5 hover:bg-black transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

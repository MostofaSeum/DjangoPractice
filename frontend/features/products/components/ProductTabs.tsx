"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/store/LanguageContext";
import Swal from "sweetalert2";

interface ReviewImageItem {
  id: number;
  image: string;
}

interface Review {
  id: number;
  user_id?: number | null;
  name: string;
  description: string;
  rating?: number;
  image?: string | null;
  images?: ReviewImageItem[];
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
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [reviewsFetched, setReviewsFetched] = useState<boolean>(false);
  const [reviewText, setReviewText] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [existingImages, setExistingImages] = useState<ReviewImageItem[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("tab") === "reviews" || window.location.hash === "#reviews") {
        setActiveTab("reviews");
        setTimeout(() => {
          document
            .getElementById("write-review-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 350);
      }
    }
  }, [fetchReviews]);

  useEffect(() => {
    const handleOpenReviews = () => {
      setActiveTab("reviews");
      if (!reviewsFetched) fetchReviews();
    };

    window.addEventListener("open-reviews-tab", handleOpenReviews);
    return () => {
      window.removeEventListener("open-reviews-tab", handleOpenReviews);
    };
  }, [reviewsFetched, fetchReviews]);

  const handleStartEdit = (rev: Review) => {
    setEditingReviewId(rev.id);
    setReviewText(rev.description);
    setRating(rev.rating || 5);
    setExistingImages(rev.images || []);
    setDeletedImageIds([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
    document
      .getElementById("write-review-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setReviewText("");
    setRating(5);
    setExistingImages([]);
    setDeletedImageIds([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setDeletedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleDeleteReview = async (reviewId: number) => {
    const result = await Swal.fire({
      title: t("swal.deleteReviewTitle") || "Delete Review?",
      text: t("swal.deleteReviewText") || "Are you sure you want to delete your review? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: t("swal.yesDeleteIt") || "Yes, delete it",
      cancelButtonText: t("swal.cancel") || "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `JWT ${token}`;
      }

      const res = await fetch(
        `${apiBaseUrl}/store/products/${productId}/reviews/${reviewId}/`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (res.ok || res.status === 204) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t("swal.reviewDeleted") || "Your review has been deleted.",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        if (editingReviewId === reviewId) {
          handleCancelEdit();
        }
        await fetchReviews();
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: errData.error || errData.detail || (locale === "bn" ? "রিভিউ মুছে ফেলা যায়নি।" : "Could not delete review."),
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t("swal.networkError") || "Network error. Could not delete review.",
        showConfirmButton: false,
        timer: 2500,
        toast: true,
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalCurrentCount = existingImages.length + selectedImages.length;
    if (totalCurrentCount >= 5) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: "Maximum 5 photos allowed per review.",
        showConfirmButton: false,
        timer: 2500,
        toast: true,
      });
      return;
    }

    const availableSlots = 5 - totalCurrentCount;
    let selectedFiles = files;
    if (files.length > availableSlots) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: `Maximum 5 photos allowed. Only ${availableSlots} photo(s) added.`,
        showConfirmButton: false,
        timer: 2500,
        toast: true,
      });
      selectedFiles = files.slice(0, availableSlots);
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          position: "top-end",
          icon: "warning",
          title: `${file.name} is larger than 5MB and was skipped.`,
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (indexToRemove: number) => {
    if (imagePreviews[indexToRemove]) {
      URL.revokeObjectURL(imagePreviews[indexToRemove]);
    }
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllSelectedImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !user) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: t("swal.signInReview") || "You must be signed in to post or edit a review.",
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
        title: t("swal.enterReview") || "Please enter your review content.",
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

      const isEditing = editingReviewId !== null;
      const url = isEditing
        ? `${apiBaseUrl}/store/products/${productId}/reviews/${editingReviewId}/`
        : `${apiBaseUrl}/store/products/${productId}/reviews/`;
      const method = isEditing ? "PATCH" : "POST";

      const formData = new FormData();
      formData.append("name", reviewerName);
      formData.append("description", reviewText.trim());
      formData.append("rating", String(rating));

      if (deletedImageIds.length > 0) {
        deletedImageIds.forEach((id) =>
          formData.append("deleted_image_ids", String(id)),
        );
      }

      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEditing
            ? t("swal.reviewUpdated") || "Your review has been updated!"
            : t("swal.reviewPublished") || "Thank you! Your review has been published.",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        handleCancelEdit();
        // Refresh reviews list
        await fetchReviews();
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          position: "top-end",
          icon: "error",
          title:
            errData.error ||
            errData.detail ||
            (locale === "bn" ? "রিভিউ সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" : "Failed to save review. Please try again."),
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
      }
    } catch (err) {
      console.error("Error saving review:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t("swal.networkError") || "Network error. Could not save review.",
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
              <img
                src={isFilled ? "/icons/star-filled.png" : "/icons/star-empty.png"}
                alt="star"
                className="w-5 h-5 object-contain"
              />
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


  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="mt-8 sm:mt-10 border-t border-foreground/10 pt-6 sm:pt-8 transition-colors duration-300">
      {/* Tab Navigation Header */}
      <div className="flex justify-center items-center space-x-3 sm:space-x-4 border-b border-foreground/10 pb-4 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === "description"
              ? "bg-button-bg text-button-fg shadow-md"
              : "bg-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          }`}
          type="button"
        >
          {t("productDetail.descriptionTab")}
        </button>

        <button
          onClick={() => {
            setActiveTab("reviews");
            if (!reviewsFetched) fetchReviews();
          }}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
            activeTab === "reviews"
              ? "bg-button-bg text-button-fg shadow-md"
              : "bg-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
          }`}
          type="button"
        >
          <span>{t("productDetail.reviewsTab")}</span>
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === "reviews"
                ? "bg-button-fg/20 text-button-fg"
                : "bg-foreground/10 text-foreground/70"
            }`}
          >
            {locale === "bn" ? reviews.length.toLocaleString("bn-BD") : reviews.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Description */}
      {activeTab === "description" && (
        <div className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-3xl mx-auto text-center font-medium px-4 break-words break-all [overflow-wrap:anywhere]">
          <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {description || (locale === "bn" ? "এই পণ্যের জন্য কোনো বিবরণ উপলব্ধ নেই।" : "No description available for this product.")}
          </p>
        </div>
      )}

      {/* Tab Content: Reviews */}
      {activeTab === "reviews" && (
        <div className="max-w-3xl mx-auto space-y-10 sm:space-y-12 px-2 sm:px-0">
          {/* Review List Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2 border-b border-foreground/10 pb-4">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
              {t("productDetail.customerReviews")}
            </h3>
            {avgRating && (
              <div className="flex items-center gap-2">
                {renderStars(Math.round(Number(avgRating)))}
                <span className="text-xs sm:text-sm font-extrabold text-foreground">
                  {locale === "bn" ? `${Number(avgRating).toLocaleString("bn-BD")} / ৫.০` : `${avgRating} / 5.0`}
                </span>
              </div>
            )}
          </div>

          {loadingReviews && reviews.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-foreground/60 uppercase font-bold tracking-wider">
              {locale === "bn" ? "রিভিউ লোড হচ্ছে..." : "Loading reviews..."}
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-secondary/50 border border-foreground/10 text-center">
              <p className="text-sm text-foreground/80 font-semibold mb-1">
                {t("productDetail.noReviewsYet")}
              </p>
              <p className="text-xs text-foreground/50">
                {t("productDetail.beTheFirst")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...reviews]
                .sort((a, b) => {
                  const aIsUser = Boolean(user && a.user_id && user.id === a.user_id);
                  const bIsUser = Boolean(user && b.user_id && user.id === b.user_id);
                  if (aIsUser && !bIsUser) return -1;
                  if (!aIsUser && bIsUser) return 1;
                  return 0;
                })
                .map((rev) => {
                  const isOwner = Boolean(user && rev.user_id && user.id === rev.user_id);
                  const canDelete = isOwner || Boolean(user?.is_staff);

                  return (
                    <div
                      key={rev.id}
                      className={`p-5 sm:p-6 rounded-2xl bg-secondary border shadow-sm transition-all hover:shadow-md ${
                        isOwner ? "border-accent/40 ring-1 ring-accent/20" : "border-foreground/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent font-black text-sm flex items-center justify-center uppercase shrink-0">
                            {rev.name ? rev.name.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground capitalize">
                                {rev.name}
                              </h4>
                              {isOwner && (
                                <span className="px-2 py-0.5 text-[9px] bg-accent/20 text-accent rounded-full font-black uppercase tracking-wider">
                                  Your Review
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              {renderStars(rev.rating || 5)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                          <span className="text-xs text-foreground/50 font-medium mr-1">
                            {formatDate(rev.date)}
                          </span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(rev)}
                              className="text-foreground/40 hover:text-accent transition-colors p-1.5 rounded-lg hover:bg-accent/10 cursor-pointer"
                              title="Edit Review"
                            >
                              <img
                                src="/icons/edit-pencil.png"
                                alt="Edit"
                                className="w-4 h-4 object-contain opacity-70 hover:opacity-100 dark:invert"
                              />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              className="text-foreground/40 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                              title="Delete Review"
                            >
                              <img
                                src="/icons/trash.png"
                                alt="Delete"
                                className="w-4 h-4 object-contain opacity-70 hover:opacity-100 dark:invert"
                              />
                            </button>
                          )}
                        </div>
                      </div>

                  <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-medium sm:pl-12">
                    {rev.description}
                  </p>

                  {/* Attached Photos Gallery */}
                  {(() => {
                    const reviewImages = [
                      ...(rev.images?.map((img) => getImageUrl(img.image)) || []),
                      ...(rev.image ? [getImageUrl(rev.image)] : []),
                    ];
                    if (reviewImages.length === 0) return null;
                    return (
                      <div className="mt-3 sm:pl-12 flex flex-wrap gap-2.5">
                        {reviewImages.map((imgSrc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageModal(imgSrc)}
                            className="relative group overflow-hidden rounded-2xl border border-foreground/15 block"
                          >
                            <img
                              src={imgSrc}
                              alt={`Review attachment ${idx + 1}`}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
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
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            </div>
          )}

          {/* Add Review Form or Auth Lock */}
          <div id="write-review-section" className="pt-8 border-t border-foreground/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground text-center sm:text-left">
                {editingReviewId ? t("productDetail.editReview") : t("productDetail.writeReview")}
              </h4>
              {editingReviewId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg border border-foreground/20 text-xs font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                >
                  {t("productDetail.cancelEdit")}
                </button>
              )}
            </div>

            {authLoading ? (
              <div className="py-4 text-xs text-foreground/50 font-bold uppercase tracking-wider text-center sm:text-left">
                {locale === "bn" ? "সাইন-ইন স্ট্যাটাস যাচাই করা হচ্ছে..." : "Checking sign-in status..."}
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
                  {t("productDetail.signInRequired")}
                </p>
                <p className="text-xs text-foreground/70 font-medium max-w-sm mx-auto">
                  {t("productDetail.signInPrompt")}
                </p>
                <div>
                  <Link
                    href={`/login?redirect=/products/${productId}`}
                    className="inline-block px-6 sm:px-8 py-3 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                  >
                    {t("productDetail.signInToReview")}
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="space-y-4 bg-secondary/40 p-5 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm"
              >

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    {t("productDetail.yourRating")} *
                  </label>
                  <div className="flex items-center gap-3 bg-background border border-foreground/15 rounded-xl px-4 py-2.5 w-fit">
                    {renderStars(rating, true)}
                    <span className="text-xs font-extrabold text-amber-500 min-w-[75px]">
                      {locale === "bn"
                        ? `${(hoverRating || rating).toLocaleString("bn-BD")} / ৫ স্টার`
                        : `${hoverRating || rating} / 5 Stars`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    {t("productDetail.yourReview")} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t("productDetail.reviewPlaceholder")}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-semibold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all resize-y"
                  />
                </div>

                {/* Attach Photos Option */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 text-foreground/80">
                    {t("productDetail.attachPhotos")} ({locale === "bn" ? (existingImages.length + selectedImages.length).toLocaleString("bn-BD") : existingImages.length + selectedImages.length}/৫)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Render Existing Saved Photos */}
                    {existingImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-foreground/20 group"
                      >
                        <img
                          src={getImageUrl(img.image)}
                          alt="Existing review photo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-black transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <img src="/icons/close-x.png" alt="Remove" className="w-3 h-3 object-contain invert" />
                        </button>
                      </div>
                    ))}

                    {/* Render Newly Selected Previews */}
                    {imagePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-foreground/20 group"
                      >
                        <img
                          src={previewUrl}
                          alt={`Review preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-black transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <img src="/icons/close-x.png" alt="Remove" className="w-3 h-3 object-contain invert" />
                        </button>
                      </div>
                    ))}

                    {existingImages.length + selectedImages.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-background border border-dashed border-foreground/25 rounded-2xl cursor-pointer hover:border-accent hover:bg-foreground/5 transition-all text-center p-2">
                        <img src="/icons/plus.png" alt="Add" className="w-5 h-5 object-contain mb-1 dark:invert opacity-70" />
                        <span className="text-[11px] font-bold text-foreground/70">
                          {existingImages.length + imagePreviews.length > 0
                            ? (locale === "bn" ? "আরও যোগ করুন" : "Add More")
                            : (locale === "bn" ? "ছবি আপলোড করুন" : "Upload Photos")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3.5 border border-foreground/20 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-foreground/5 transition-all cursor-pointer"
                    >
                      {t("productDetail.cancelEdit")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting
                      ? editingReviewId
                        ? (locale === "bn" ? "আপডেট হচ্ছে..." : "Updating...")
                        : (locale === "bn" ? "জমা দেওয়া হচ্ছে..." : "Submitting...")
                      : editingReviewId
                      ? t("productDetail.updateReview")
                      : t("productDetail.submitReview")}
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

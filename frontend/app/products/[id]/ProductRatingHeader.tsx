'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/config/siteConfig';
import { useLanguage } from '@/store/LanguageContext';

interface Review {
  id: number;
  rating?: number;
}

export default function ProductRatingHeader({ productId }: { productId: number }) {
  const { t, locale } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/store/products/${productId}/reviews/`, {
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : data.results || []);
        }
      } catch (err) {
        console.error("Failed to load header reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [productId]);

  const count = reviews.length;
  const avgRating =
    count > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / count).toFixed(1)
      : "0.0";

  const renderHeaderStars = (ratingVal: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(ratingVal);
      stars.push(
        <img
          key={i}
          src={isFilled ? "/icons/star-filled.png" : "/icons/star-empty.png"}
          alt="star"
          className="w-3.5 h-3.5 object-contain inline-block"
        />
      );
    }
    return stars;
  };

  const scrollToReviews = () => {
    window.dispatchEvent(new CustomEvent("open-reviews-tab"));
    const tabsElement = document.getElementById("product-tabs");
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 mt-3 mb-6 animate-pulse">
        <div className="h-4 w-24 bg-foreground/10 rounded" />
        <div className="h-3 w-28 bg-foreground/10 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={scrollToReviews}
      className="flex items-center space-x-2 mt-3 mb-6 cursor-pointer group w-fit"
      title="View Customer Reviews"
    >
      <div className="flex items-center gap-1">
        {renderHeaderStars(Number(avgRating))}
      </div>
      {count > 0 && (
        <span className="text-xs font-black text-foreground group-hover:text-accent transition-colors">
          {locale === "bn" ? Number(avgRating).toLocaleString("bn-BD") : avgRating}
        </span>
      )}
      <span className="text-[11px] opacity-70 font-bold uppercase tracking-wider group-hover:text-accent transition-colors">
        ({locale === "bn" ? `${count.toLocaleString("bn-BD")} টি রিভিউ` : `${count} ${count === 1 ? "Customer Review" : "Customer Reviews"}`})
      </span>
    </div>
  );
}

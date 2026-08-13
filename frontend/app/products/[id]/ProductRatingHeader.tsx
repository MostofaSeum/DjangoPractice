'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/config/siteConfig';

interface Review {
  id: number;
  rating?: number;
}

export default function ProductRatingHeader({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/store/products/${productId}/reviews/`);
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
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isFilled ? "#f59e0b" : "none"}
          stroke={isFilled ? "#f59e0b" : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isFilled ? "text-amber-500" : "text-foreground/30"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    }
    return stars;
  };

  const scrollToReviews = () => {
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
          {avgRating}
        </span>
      )}
      <span className="text-[11px] opacity-70 font-bold uppercase tracking-wider group-hover:text-accent transition-colors">
        ({count} {count === 1 ? "Customer Review" : "Customer Reviews"})
      </span>
    </div>
  );
}

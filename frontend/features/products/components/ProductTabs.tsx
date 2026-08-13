'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/config/siteConfig';
import Swal from 'sweetalert2';

interface Review {
  id: number;
  name: string;
  description: string;
  date: string;
}

interface ProductTabsProps {
  productId: number;
  description?: string;
}

export default function ProductTabs({ productId, description }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [reviewsFetched, setReviewsFetched] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
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
    if (!name.trim() || !reviewText.trim()) {
      Swal.fire({
        position: 'top-end',
        icon: 'warning',
        title: 'Please fill in both your name and review content.',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: reviewText.trim(),
        }),
      });

      if (res.ok) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Thank you! Your review has been published.',
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
        setName('');
        setReviewText('');
        // Refresh reviews list
        await fetchReviews();
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: errData.detail || 'Failed to submit review. Please try again.',
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Network error. Could not post review.',
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
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mt-20 border-t border-foreground/10 pt-12">
      {/* Tab Navigation Header */}
      <div className="flex space-x-8 border-b border-foreground/10 pb-4 mb-8">
        <button
          onClick={() => setActiveTab('description')}
          className={`text-xs font-black uppercase tracking-widest pb-4 -mb-[18px] transition-colors ${
            activeTab === 'description'
              ? 'border-b-2 border-current text-foreground'
              : 'text-foreground/40 hover:text-foreground'
          }`}
          type="button"
        >
          Description
        </button>

        <button
          onClick={() => {
            setActiveTab('reviews');
            if (!reviewsFetched) fetchReviews();
          }}
          className={`text-xs font-black uppercase tracking-widest pb-4 -mb-[18px] transition-colors flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-b-2 border-current text-foreground'
              : 'text-foreground/40 hover:text-foreground'
          }`}
          type="button"
        >
          <span>Reviews</span>
          <span className="px-2 py-0.5 text-[10px] bg-accent/20 text-foreground rounded-full font-extrabold">
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Description */}
      {activeTab === 'description' && (
        <div className="text-sm opacity-80 leading-loose max-w-4xl font-medium">
          <p>{description || 'No description available for this product.'}</p>
        </div>
      )}

      {/* Tab Content: Reviews */}
      {activeTab === 'reviews' && (
        <div className="max-w-4xl space-y-12">
          {/* Review List Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              Customer Reviews ({reviews.length})
            </h3>
          </div>

          {loadingReviews && reviews.length === 0 ? (
            <div className="py-8 text-center text-sm opacity-60 uppercase font-bold tracking-wider">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-secondary/50 border border-foreground/10 text-center">
              <p className="text-sm opacity-70 font-semibold mb-2">No reviews yet for this product.</p>
              <p className="text-xs opacity-50">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-secondary border border-foreground/10 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 text-foreground font-black text-sm flex items-center justify-center uppercase">
                        {rev.name ? rev.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground capitalize">{rev.name}</h4>
                        <span className="text-[10px] opacity-50 font-bold uppercase tracking-wider">
                          Verified Buyer
                        </span>
                      </div>
                    </div>
                    <span className="text-xs opacity-50 font-medium">{formatDate(rev.date)}</span>
                  </div>
                  <p className="text-sm opacity-85 leading-relaxed font-medium pl-12">
                    {rev.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add Review Form */}
          <div className="pt-8 border-t border-foreground/10">
            <h4 className="text-base font-black uppercase tracking-tight text-foreground mb-6">
              Write a Review
            </h4>

            <form onSubmit={handleSubmitReview} className="space-y-4 bg-secondary/40 p-6 md:p-8 rounded-3xl border border-foreground/10 shadow-sm">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 opacity-80">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest mb-2 opacity-80">
                  Your Review *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your detailed review about this product..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

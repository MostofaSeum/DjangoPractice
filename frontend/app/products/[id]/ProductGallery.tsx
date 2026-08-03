'use client';

import { useState, useEffect } from 'react';
import ProductImage from '@/components/ui/ProductImage';

interface ProductImageItem {
  id?: number;
  image: string;
}

interface ProductGalleryProps {
  title: string;
  images?: ProductImageItem[];
}

export default function ProductGallery({ title, images = [] }: ProductGalleryProps) {
  const [galleryImages, setGalleryImages] = useState<ProductImageItem[]>(images);

  useEffect(() => {
    setGalleryImages(images);
  }, [images]);

  const handleSwap = (targetIndex: number) => {
    if (!galleryImages[targetIndex]) return;

    setGalleryImages((prev) => {
      const updated = [...prev];
      // 2-Way Swap: swap index 0 (main) with targetIndex (clicked thumbnail)
      const temp = updated[0];
      updated[0] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const mainImage = galleryImages[0] ? [galleryImages[0]] : [];

  return (
    <div className="space-y-4">
      {/* Main Image Display Box */}
      <div className="aspect-[4/5] w-full rounded-2xl border border-foreground/10 bg-primary/5 dark:bg-primary/40 flex items-center justify-center relative overflow-hidden shadow-sm">
        <ProductImage title={title} images={mainImage} alt={title} />
      </div>

      {/* Detail Thumbnails (4 slots for images 1..4) */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => {
          const imgObj = galleryImages[i];

          return (
            <div
              key={i}
              onClick={imgObj ? () => handleSwap(i) : undefined}
              className={`aspect-square w-full rounded-xl bg-primary/5 dark:bg-primary/40 flex items-center justify-center text-center text-[10px] text-foreground/30 font-bold relative overflow-hidden shadow-sm transition-all ${
                imgObj ? 'cursor-pointer hover:opacity-85 hover:scale-98 active:scale-95 border-2 border-transparent hover:border-accent/30' : 'border border-foreground/5'
              }`}
            >
              {imgObj ? (
                <ProductImage
                  title={`${title} detail ${i}`}
                  images={[imgObj]}
                  alt={`${title} detail ${i}`}
                />
              ) : (
                <span className="z-10 uppercase tracking-widest text-[9px] px-2">
                  Detail {i}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const detailImages = galleryImages.slice(1);

  return (
    <div className="space-y-4">
      {/* Main Image Display Box */}
      <div className="aspect-[4/5] w-full rounded-2xl border border-foreground/10 bg-secondary flex items-center justify-center relative overflow-hidden shadow-sm">
        <ProductImage title={title} images={mainImage} alt={title} />
      </div>

      {/* Detail Thumbnails (Only render existing photos 2..5) */}
      {detailImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {detailImages.map((imgObj, idx) => {
            const realIndex = idx + 1;

            return (
              <div
                key={imgObj.id || idx}
                onClick={() => handleSwap(realIndex)}
                className="aspect-square w-full rounded-xl bg-secondary flex items-center justify-center text-center text-[10px] text-foreground/30 font-bold relative overflow-hidden shadow-sm transition-all cursor-pointer hover:opacity-85 hover:scale-98 active:scale-95 border-2 border-transparent hover:border-accent/30"
              >
                <ProductImage
                  title={`${title} detail ${realIndex}`}
                  images={[imgObj]}
                  alt={`${title} detail ${realIndex}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

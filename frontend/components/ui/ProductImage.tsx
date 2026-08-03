import Image from "next/image";
import { siteConfig } from "@/config/siteConfig";

interface ProductImageItem {
  id?: number;
  image: string;
}

interface ProductImageProps {
  title: string;
  images?: ProductImageItem[];
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  alt?: string;
}

export default function ProductImage({
  title,
  images,
  className = "object-cover group-hover:scale-105 transition-transform duration-500",
  fill = true,
  width,
  height,
  alt,
}: ProductImageProps) {
  // 1. Photo from Django backend if available
  if (images && images.length > 0 && images[0].image) {
    const apiBaseUrl = siteConfig.apiBaseUrl.replace(/\/+$/, "");
    let imageUrl = images[0].image;

    // Handle relative path from Django serializer
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      imageUrl = `${apiBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    return (
      <Image
        src={imageUrl}
        alt={alt || title}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        unoptimized
      />
    );
  }

  // 2. Default stylized fallback if no photo exists
  return (
    <div className="w-full h-full bg-primary/5 dark:bg-primary/40 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
      <span className="text-foreground/20 font-black text-lg uppercase tracking-widest text-center px-2">
        {title ? title.split(" ")[0] : "PRODUCT"}
      </span>
    </div>
  );
}

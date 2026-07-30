import Image from "next/image";

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
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
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
    <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
      <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest text-center px-2">
        {title ? title.split(" ")[0] : "PRODUCT"}
      </span>
    </div>
  );
}

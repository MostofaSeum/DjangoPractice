import Image from "next/image";

const PRODUCT_IMAGES: Record<string, string> = {
  "7up Diet, 355 Ml": "/Products/7up Diet, 355 Ml.jpg",
  "Absolut Citron": "/Products/Absolut Citron.jpg",
  "Allspice - Jamaican": "/Products/Allspice - Jamaican.jpg",
  "Amaretto": "/Products/Amaretto.jpg",
  "Anchovy Paste - 56 G Tube": "/Products/Anchovy Paste - 56 G Tube.jpg",
  "Appetizer - Asian Shrimp Roll": "/Products/Appetizer - Asian Shrimp Roll.jpg",
  "Appetizer - Crab And Brie": "/Products/Appetizer - Crab And Brie.jpg",
  "Appetizer - Sausage Rolls": "/Products/Appetizer - Sausage Rolls.jpg",
};

export function getProductImagePath(title: string): string | null {
  if (!title) return null;
  // Match exact title in predefined dictionary
  if (PRODUCT_IMAGES[title]) {
    return PRODUCT_IMAGES[title];
  }

  // Fallback case-insensitive match or cleaned title match
  const normalizedTitle = title.trim().toLowerCase();
  for (const [key, value] of Object.entries(PRODUCT_IMAGES)) {
    if (key.toLowerCase() === normalizedTitle) {
      return value;
    }
  }

  return null;
}

interface ProductImageProps {
  title: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  alt?: string;
}

export default function ProductImage({
  title,
  className = "object-cover group-hover:scale-105 transition-transform duration-500",
  fill = true,
  width,
  height,
  alt,
}: ProductImageProps) {
  const imagePath = getProductImagePath(title);

  if (imagePath) {
    return (
      <Image
        src={imagePath}
        alt={alt || title}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        unoptimized
      />
    );
  }

  // Default stylized fallback if no photo exists for this product
  return (
    <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
      <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest text-center px-2">
        {title ? title.split(" ")[0] : "PRODUCT"}
      </span>
    </div>
  );
}

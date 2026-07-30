import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "./AddToCartButton";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-[#f4f1eb] rounded-3xl p-5 shadow-sm border border-[#3a3532]/5 hover:border-[#3a3532]/20 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-white/50">
          <ProductImage title={product.title} images={product.images} />
        </div>
        <h3 className="font-bold text-base text-[#3a3532] line-clamp-1">{product.title}</h3>
        <p className="text-xs text-[#3a3532]/60 mt-1 line-clamp-2">{product.description || "No description available."}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-[#3a3532]/10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3a3532]/50">Price</span>
          <span className="text-lg font-black text-[#3a3532]">${Number(product.unit_price).toFixed(2)}</span>
        </div>
        <AddToCartButton productId={product.id} productTitle={product.title} inventory={product.inventory} />
      </div>
    </div>
  );
}

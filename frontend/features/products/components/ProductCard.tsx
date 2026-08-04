import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "./AddToCartButton";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-secondary border border-foreground/10 group-hover:scale-[1.02] transition-transform duration-300">
          <ProductImage title={product.title} images={product.images} />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
          {product.title}
        </h3>
        <p className="text-xs opacity-70 mb-4 line-clamp-2 leading-relaxed">
          {product.description || "No description available."}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 pt-3 border-t border-foreground/10">
          <span className="text-accent font-extrabold text-lg">${Number(product.unit_price).toFixed(2)}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Qty: {product.inventory}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/products/${product.id}`}
            className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
          >
            View Details
          </Link>
          <AddToCartButton
            productId={product.id}
            productTitle={product.title}
            inventory={product.inventory}
            className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
          />
        </div>
      </div>
    </div>
  );
}

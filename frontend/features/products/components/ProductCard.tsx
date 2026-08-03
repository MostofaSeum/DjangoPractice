import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "./AddToCartButton";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-secondary text-foreground rounded-3xl p-5 shadow-sm border border-foreground/10 hover:border-accent/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-primary/5 dark:bg-primary/40">
          <ProductImage title={product.title} images={product.images} />
        </div>
        <h3 className="font-bold text-base text-foreground line-clamp-1">{product.title}</h3>
        <p className="text-xs opacity-70 mt-1 line-clamp-2">{product.description || "No description available."}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-foreground/10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Price</span>
          <span className="text-lg font-black text-foreground">${Number(product.unit_price).toFixed(2)}</span>
        </div>
        <AddToCartButton productId={product.id} productTitle={product.title} inventory={product.inventory} />
      </div>
    </div>
  );
}

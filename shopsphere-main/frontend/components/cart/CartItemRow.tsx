"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, getProductImage } from "@/lib/api";
import Button from "@/components/ui/Button";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  updating?: boolean;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  updating,
}: CartItemRowProps) {
  const product = item.product;
  const image = product ? getProductImage(product) : "/placeholder-product.svg";

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <Link
        href={product ? `/products/${product.slug}` : "#"}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50"
      >
        <Image src={image} alt={product?.name || "Product"} fill className="object-cover" sizes="80px" />
      </Link>
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={product ? `/products/${product.slug}` : "#"}
            className="font-medium text-foreground hover:text-primary"
          >
            {product?.name || "Product"}
          </Link>
          {item.variant && (
            <p className="text-sm text-muted">
              {item.variant.variant_name}: {item.variant.variant_value}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-secondary">
            {formatPrice(item.unit_price)}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3 sm:mt-0">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              disabled={updating || item.quantity <= 1}
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1 text-lg hover:bg-gray-50 disabled:opacity-50"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              disabled={updating}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1 text-lg hover:bg-gray-50 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <p className="min-w-[5rem] text-right font-semibold">
            {formatPrice(item.line_total)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            disabled={updating}
            className="text-red-600"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

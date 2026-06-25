"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

import { cartApi, formatPrice, STORAGE_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/types";

/*
|--------------------------------------------------------------------------
| Product image URL
|--------------------------------------------------------------------------
|
| First it searches for the primary product image.
| If no primary image exists, it uses the first image.
| If no image exists, it uses the placeholder image.
|
*/

function getProductImageUrl(product: Product): string {
  const image =
    product.images?.find((item) => item.is_primary) ??
    product.images?.[0];

  if (!image) {
    return "/placeholder-product.svg";
  }

  if (image.url) {
    return image.url;
  }

  if (image.image_path) {
    if (/^https?:\/\//i.test(image.image_path)) {
      return image.image_path;
    }

    return `${STORAGE_BASE}/${image.image_path.replace(/^\/+/, "")}`;
  }

  return "/placeholder-product.svg";
}

/*
|--------------------------------------------------------------------------
| Calculate discount percentage
|--------------------------------------------------------------------------
*/

function getDiscountPercentage(product: Product): number | null {
  const regularPrice = Number(product.price);
  const discountPrice = Number(product.discount_price);

  if (
    !product.discount_price ||
    regularPrice <= 0 ||
    discountPrice >= regularPrice
  ) {
    return null;
  }

  return Math.round(
    ((regularPrice - discountPrice) / regularPrice) * 100,
  );
}

/*
|--------------------------------------------------------------------------
| Rating stars
|--------------------------------------------------------------------------
*/

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={
            index < roundedRating
              ? "text-amber-400"
              : "text-gray-300"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Product Card
|--------------------------------------------------------------------------
*/

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const regularPrice = Number(product.price);

  const currentPrice = Number(
    product.discount_price ??
      product.effective_price ??
      product.price,
  );

  const discountPercentage =
    getDiscountPercentage(product);

  const rating = Number(product.average_rating ?? 0);
  const reviewCount = Number(product.review_count ?? 0);

  /*
  |--------------------------------------------------------------------------
  | Select available product variant
  |--------------------------------------------------------------------------
  */

  const selectedVariant =
    product.variants?.find(
      (variant) => Number(variant.stock_qty) > 0,
    ) ?? product.variants?.[0];

  const availableStock = selectedVariant
    ? Number(selectedVariant.stock_qty)
    : Number(product.stock_qty ?? 0);

  const outOfStock = availableStock <= 0;

  /*
  |--------------------------------------------------------------------------
  | Add product to cart
  |--------------------------------------------------------------------------
  */

  async function handleAddToCart(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    /*
     * Cart API requires the customer to be logged in.
     * Send guests to the login page.
     */

    if (!isAuthenticated) {
      const redirect =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/";

      router.push(
        `/login?redirect=${encodeURIComponent(redirect)}`,
      );

      return;
    }

    try {
      setAdding(true);
      setAdded(false);

      await cartApi.addItem({
        product_id: product.id,
        product_variant_id:
          selectedVariant?.id ?? null,
        quantity: 1,
      });

      setAdded(true);

      window.setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Unable to add product to cart:",
        error,
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
      {/* Product image */}

      <Link
        href={`/products/${product.slug}`}
        className="block"
      >
        <div className="relative h-52 overflow-hidden rounded-xl bg-white sm:h-56 lg:h-60">
          {/* Discount badge */}

          {discountPercentage !== null && (
            <span className="absolute left-0 top-0 z-10 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
              -{discountPercentage}%
            </span>
          )}

          <Image
            src={getProductImageUrl(product)}
            alt={product.name}
            fill
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        {/* Brand or category */}

        <p className="text-sm text-gray-400">
          {product.brand ||
            product.category?.name ||
            "ShopSphere"}
        </p>

        {/* Product name */}

        <Link
          href={`/products/${product.slug}`}
          className="mt-1 block"
        >
          <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-900 transition group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}

        <div className="mt-3 flex items-center gap-2 text-sm">
          <RatingStars rating={rating} />

          <span className="text-gray-400">
            ({reviewCount})
          </span>
        </div>

        {/* Product price */}

        <div className="mt-4 flex min-h-8 items-center gap-2">
          {discountPercentage !== null && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(regularPrice)}
            </span>
          )}

          <span className="text-xl font-extrabold text-primary">
            {formatPrice(currentPrice)}
          </span>
        </div>

        {/* Add to cart */}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || outOfStock}
          className="mt-6 w-full rounded-full bg-gray-100 px-4 py-3 text-sm font-extrabold tracking-wide text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {outOfStock
            ? "OUT OF STOCK"
            : adding
              ? "ADDING..."
              : added
                ? "ADDED TO CART"
                : "ADD TO CART"}
        </button>
      </div>
    </article>
  );
}
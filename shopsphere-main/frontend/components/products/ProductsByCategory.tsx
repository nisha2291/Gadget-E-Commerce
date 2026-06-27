"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCartShopping,
  FaCheck,
  FaCircleExclamation,
  FaStar,
} from "react-icons/fa6";

import {
  ApiError,
  cartApi,
  catalogApi,
  formatPrice,
  getProductImage,
  getProductPrice,
} from "@/lib/api";

import { useCart } from "@/lib/cart"; // ✅ added

import type {
  Product,
  ProductVariant,
} from "@/types";

/* =========================================================
   CATEGORY SETTINGS
========================================================= */

const categoryGroups = {
  accessories: {
    label: "Accessories",
    slugs: ["accessories", "earbuds"],
  },

  gadgets: {
    label: "Gadgets",
    slugs: [
      "laptops",
      "desktop-pcs",
      "all-in-one-desktops",
    ],
  },

  smartDevices: {
    label: "Smart Devices",
    slugs: ["mobile-phones", "earbuds"],
  },
} as const;

type CategoryGroupKey =
  keyof typeof categoryGroups;

/* =========================================================
   MIX PRODUCTS FROM DIFFERENT CATEGORIES
========================================================= */

function mixCategoryProducts(
  categoryProductLists: Product[][],
  limit: number,
): Product[] {
  const mixedProducts: Product[] = [];
  const usedProductIds = new Set<number>();

  let productIndex = 0;

  while (mixedProducts.length < limit) {
    let productWasAdded = false;

    for (const productList of categoryProductLists) {
      const product = productList[productIndex];

      if (
        product &&
        !usedProductIds.has(product.id)
      ) {
        mixedProducts.push(product);
        usedProductIds.add(product.id);

        productWasAdded = true;

        if (mixedProducts.length === limit) {
          break;
        }
      }
    }

    if (!productWasAdded) {
      break;
    }

    productIndex += 1;
  }

  return mixedProducts;
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = (
      error as { message?: unknown }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to add this product to your cart.";
}

/* =========================================================
   PRODUCT CARD
========================================================= */

type ProductCardProps = {
  product: Product;
  addedCount: number;
  onProductAdded: (
    productId: number,
  ) => void;
};

function ProductCard({
  product,
  addedCount,
  onProductAdded,
}: ProductCardProps) {
  const [adding, setAdding] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [error, setError] =
    useState("");

  const { refreshCart } = useCart(); // ✅ added

  const productImage =
    getProductImage(product);

  useEffect(() => {
    setImageFailed(false);
    setError("");
  }, [productImage]);

  /*
   * Automatically select the first variant
   * that currently has stock.
   */
  const selectedVariant =
    useMemo<ProductVariant | null>(() => {
      if (!product.variants?.length) {
        return null;
      }

      return (
        product.variants.find(
          (variant) =>
            Number(
              variant.stock_qty ?? 0,
            ) > 0,
        ) ??
        product.variants[0] ??
        null
      );
    }, [product.variants]);

  const price = getProductPrice(
    product,
    selectedVariant,
  );

  const availableStock = Number(
    selectedVariant
      ? selectedVariant.stock_qty ?? 0
      : product.stock_qty ?? 0,
  );

  const inStock = availableStock > 0;

  const averageRating = Number(
    product.average_rating ?? 0,
  );

  async function handleAddToCart() {
    if (!inStock || adding) {
      return;
    }

    setAdding(true);
    setError("");

    try {
      /*
       * Existing Laravel cart backend.
       * Every click adds one more product.
       */
      await cartApi.addItem({
        product_id: product.id,
        product_variant_id:
          selectedVariant?.id ?? null,
        quantity: 1,
      });

      /*
       * The number changes only after the
       * backend request succeeds.
       */
      onProductAdded(product.id);

      await refreshCart(); // ✅ added — instantly syncs Header's cart count
    } catch (error) {
      console.error(
        "Add to cart failed:",
        error,
      );

      setError(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  return (
    <article
      className="
        group relative flex h-full min-h-[520px]
        flex-col overflow-hidden rounded-[1.75rem]
        border-2 border-transparent bg-white p-5
        shadow-sm transition-all duration-300
        hover:-translate-y-2
        hover:border-blue-500
        hover:shadow-2xl
        hover:shadow-blue-500/20
        hover:ring-4
        hover:ring-blue-500/10
      "
    >
      {/* Decorative tech corner */}
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 overflow-hidden">
        <div className="absolute -right-14 -top-14 h-28 w-28 rotate-45 bg-gradient-to-br from-blue-500/20 to-indigo-600/5" />
      </div>

      {/* Stock information */}
      <div
        className={`absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
          inStock
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-600"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            inStock
              ? "animate-pulse bg-emerald-500"
              : "bg-red-500"
          }`}
        />

        {inStock
          ? `${availableStock} in stock`
          : "Out of stock"}
      </div>

      {/* Product details link */}
      <Link
        href={`/products/${product.slug}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        {/* Product image */}
        <div className="relative mt-5 flex h-60 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-5">
          {/* Blue grid background */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:22px_22px]" />

          {imageFailed || !productImage ? (
            <div className="relative z-10 text-center">
              <div className="text-6xl">
                💻
              </div>

              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Image unavailable
              </p>
            </div>
          ) : (
            <img
              src={productImage}
              alt={product.name}
              className="relative z-10 h-full w-full object-contain transition duration-500 group-hover:scale-110"
              onError={() =>
                setImageFailed(true)
              }
            />
          )}
        </div>

        {/* Product brand */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {product.brand || "ShopSphere"}
          </p>

          {selectedVariant && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
              Variant available
            </span>
          )}
        </div>

        {/* Product name */}
        <h3 className="mt-2 line-clamp-2 min-h-14 text-lg font-black leading-7 text-[#111858] transition group-hover:text-blue-600">
          {product.name}
        </h3>

        {/* Product rating */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <FaStar
                  key={star}
                  size={13}
                  className={
                    star <=
                    Math.round(
                      averageRating,
                    )
                      ? "text-amber-400"
                      : "text-slate-200"
                  }
                />
              ),
            )}
          </div>

          <span className="text-xs font-medium text-slate-400">
            {averageRating.toFixed(1)}
            {" · "}
            {product.review_count ?? 0}
            {" reviews"}
          </span>
        </div>

        {/* Price */}
        <p className="mt-5 text-2xl font-black text-[#111858]">
          {formatPrice(price)}
        </p>
      </Link>

      {/* Add to cart area */}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className="
            relative flex w-full items-center
            justify-center gap-3 overflow-hidden
            rounded-2xl bg-gradient-to-r
            from-blue-600 via-indigo-600 to-[#111858]
            px-5 py-3.5 text-sm font-black
            uppercase tracking-wide text-white
            shadow-lg shadow-blue-600/20
            transition-all duration-300
            before:absolute before:inset-0
            before:-translate-x-full
            before:bg-gradient-to-r
            before:from-transparent
            before:via-white/20
            before:to-transparent
            before:transition-transform
            before:duration-700
            hover:-translate-y-0.5
            hover:shadow-xl
            hover:shadow-blue-600/35
            hover:before:translate-x-full
            disabled:cursor-not-allowed
            disabled:from-slate-300
            disabled:via-slate-300
            disabled:to-slate-400
            disabled:shadow-none
          "
        >
          {/* Cart icon changes into quantity */}
          <span
            className={`relative z-10 flex h-8 min-w-8 items-center justify-center rounded-full px-2 ${
              addedCount > 0
                ? "bg-white font-black text-blue-700"
                : "bg-white/15 text-white"
            }`}
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : addedCount > 0 ? (
              addedCount
            ) : (
              <FaCartShopping size={15} />
            )}
          </span>

          <span className="relative z-10">
            {adding
              ? "Adding..."
              : !inStock
                ? "Out of Stock"
                : addedCount > 0
                  ? "Add Another"
                  : "Add to Cart"}
          </span>

          {addedCount > 0 &&
            !adding && (
              <FaCheck
                size={14}
                className="relative z-10 text-emerald-300"
              />
            )}
        </button>

        {/* Successfully added information */}
        {addedCount > 0 && !error && (
          <p className="mt-3 text-center text-xs font-semibold text-emerald-600">
            {addedCount}{" "}
            {addedCount === 1
              ? "item"
              : "items"}{" "}
            added successfully
          </p>
        )}

        {/* Backend error */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium leading-5 text-red-600">
            <FaCircleExclamation className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   PRODUCT LOADING SKELETON
========================================================= */

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="h-60 rounded-2xl bg-slate-200" />

      <div className="mt-5 h-3 w-24 rounded bg-slate-200" />

      <div className="mt-3 h-5 w-full rounded bg-slate-200" />

      <div className="mt-2 h-5 w-3/4 rounded bg-slate-200" />

      <div className="mt-4 h-4 w-32 rounded bg-slate-200" />

      <div className="mt-5 h-8 w-32 rounded bg-slate-200" />

      <div className="mt-6 h-12 w-full rounded-2xl bg-slate-200" />
    </div>
  );
}

/* =========================================================
   PRODUCTS BY CATEGORY
========================================================= */

export default function ProductsByCategory() {
  const [activeGroup, setActiveGroup] =
    useState<CategoryGroupKey>(
      "accessories",
    );

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Stores the number added for every product.
   *
   * Example:
   * {
   *   1: 2,
   *   5: 1
   * }
   */
  const [addedCounts, setAddedCounts] =
    useState<Record<number, number>>({});

  function handleProductAdded(
    productId: number,
  ) {
    setAddedCounts((current) => ({
      ...current,
      [productId]:
        (current[productId] ?? 0) + 1,
    }));
  }

  useEffect(() => {
    let componentIsActive = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const selectedGroup =
          categoryGroups[activeGroup];

        const responses =
          await Promise.all(
            selectedGroup.slugs.map(
              (slug) =>
                catalogApi.getCategoryProducts(
                  slug,
                  {
                    per_page: 3,
                  },
                ),
            ),
          );

        const categoryProductLists =
          responses.map(
            (response) =>
              response.data ?? [],
          );

        const mixedProducts =
          mixCategoryProducts(
            categoryProductLists,
            3,
          );

        if (componentIsActive) {
          setProducts(mixedProducts);
        }
      } catch (error) {
        console.error(
          "Unable to load category products:",
          error,
        );

        if (componentIsActive) {
          setProducts([]);

          setError(
            "Unable to load products. Make sure the Laravel API is running.",
          );
        }
      } finally {
        if (componentIsActive) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      componentIsActive = false;
    };
  }, [activeGroup]);

  return (
    <section className="relative overflow-hidden bg-[#f1f3ff] px-4 py-14 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Heading and tabs */}
        <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Explore our technology
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#111858] sm:text-4xl">
              Products By Category
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Discover laptops, smart devices,
              earbuds and accessories for modern
              everyday life.
            </p>
          </div>

          <div
            className="flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-white/80 bg-white/60 p-2 shadow-sm backdrop-blur-sm"
            role="tablist"
            aria-label="Product categories"
          >
            {(
              Object.entries(
                categoryGroups,
              ) as [
                CategoryGroupKey,
                (typeof categoryGroups)[CategoryGroupKey],
              ][]
            ).map(([key, group]) => {
              const isActive =
                activeGroup === key;

              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() =>
                    setActiveGroup(key)
                  }
                  className={`whitespace-nowrap rounded-xl px-6 py-3 text-sm font-black transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-[#111858] text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            No products are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addedCount={
                  addedCounts[product.id] ?? 0
                }
                onProductAdded={
                  handleProductAdded
                }
              />
            ))}
          </div>
        )}

        {/* View more products */}
        {!loading && products.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              href={`/products?category=${activeGroup}`}
              className="
                group relative inline-flex items-center gap-2
                overflow-hidden rounded-2xl border-2 border-[#111858]
                bg-white px-8 py-3.5 text-sm font-black
                uppercase tracking-wide text-[#111858]
                shadow-sm transition-all duration-300
                hover:-translate-y-0.5 hover:bg-[#111858]
                hover:text-white hover:shadow-lg
                hover:shadow-blue-600/20
              "
            >
              View More Products

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
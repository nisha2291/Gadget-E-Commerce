"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, API_BASE, getProductImage } from "@/lib/api";

type Category = {
  id: number;
  name: string;
  slug?: string;
};

function extractCategories(response: unknown): Category[] {
  if (Array.isArray(response)) {
    return response as Category[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    const firstData = (response as { data?: unknown }).data;

    if (Array.isArray(firstData)) {
      return firstData as Category[];
    }
  }

  return [];
}

function getFirstValidationError(
  errors: unknown,
): string | null {
  if (!errors || typeof errors !== "object") {
    return null;
  }

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }

    if (typeof value === "string") {
      return value;
    }
  }

  return null;
}

export default function EditProductPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  // Existing images already saved on the product
  const [existingImages, setExistingImages] = useState<
    { id: number; url: string }[]
  >([]);

  // Newly selected images (replace all images on submit, like Add Product)
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load product + categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setCategoriesLoading(true);
      setError("");

      try {
        const [product, categoriesResponse] = await Promise.all([
          adminApi.products.get(id),
          fetch(`${API_BASE}/categories`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }).then((response) => response.json().catch(() => null)),
        ]);

        const categoryList = extractCategories(categoriesResponse);
        setCategories(categoryList);

        setName(product.name ?? "");
        setSku(product.sku ?? "");
        setBrand(product.brand ?? "");
        setPrice(
          product.price !== undefined && product.price !== null
            ? String(product.price)
            : "",
        );
        setDiscountPrice(
          product.discount_price !== undefined &&
            product.discount_price !== null
            ? String(product.discount_price)
            : "",
        );
        setStockQty(
          product.stock_qty !== undefined && product.stock_qty !== null
            ? String(product.stock_qty)
            : "0",
        );
        setDescription(product.description ?? "");
        setStatus(product.status ?? "active");
        setCategoryId(
          product.category_id ? String(product.category_id) : "",
        );

        const productImages = (product.images ?? []).map((image) => ({
          id: image.id,
          url: image.url ?? getProductImage(product),
        }));

        setExistingImages(productImages);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Product could not be loaded.",
        );
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    }

    void loadData();

    return () => {
      controller.abort();
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Generate preview URLs for newly selected images
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const previewUrls = images.map((image) => URL.createObjectURL(image));

    setImagePreviews(previewUrls);

    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [images]);

  /*
  |--------------------------------------------------------------------------
  | Select new product images
  |--------------------------------------------------------------------------
  */

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      setImages([]);
      return;
    }

    if (selectedFiles.length > 8) {
      setError("You may upload a maximum of 8 images.");
      setImages([]);
      event.target.value = "";
      return;
    }

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

    const invalidTypeFile = selectedFiles.find(
      (file) => !acceptedTypes.includes(file.type),
    );

    if (invalidTypeFile) {
      setError("Images must be JPG, JPEG, PNG, or WebP.");
      setImages([]);
      event.target.value = "";
      return;
    }

    const maximumSize = 4 * 1024 * 1024;

    const oversizedFile = selectedFiles.find(
      (file) => file.size > maximumSize,
    );

    if (oversizedFile) {
      setError("Each image must not be larger than 4 MB.");
      setImages([]);
      event.target.value = "";
      return;
    }

    setError("");
    setImages(selectedFiles);
  }

  function removeNewImage(index: number) {
    setImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update product
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Please select a product category.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("category_id", categoryId);
      formData.append("name", name.trim());
      formData.append("sku", sku.trim());
      formData.append("brand", brand.trim());
      formData.append("price", price);
      formData.append("discount_price", discountPrice);
      formData.append("stock_qty", stockQty);
      formData.append("description", description.trim());
      formData.append("status", status);

      // Only send new images if the admin selected replacements
      images.forEach((image) => {
        formData.append("images[]", image);
      });

      await adminApi.products.update(id, formData);

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      const validationError =
        submitError && typeof submitError === "object" && "errors" in submitError
          ? getFirstValidationError(
              (submitError as { errors?: unknown }).errors,
            )
          : null;

      setError(
        validationError ??
          (submitError instanceof Error
            ? submitError.message
            : "Product could not be updated."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#121358] focus:ring-2 focus:ring-[#121358]/10";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-sm text-gray-500">Loading product...</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm font-semibold text-[#121358] hover:text-[#1d1e75]"
      >
        ← Back to products
      </Link>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Edit Product</h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Product category
            </label>

            <select
              id="category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              disabled={categoriesLoading || categories.length === 0}
              className={`${inputClass} bg-white disabled:cursor-not-allowed disabled:bg-gray-100`}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "Select a category"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Product name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Enter product name"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="sku"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              SKU
            </label>

            <input
              id="sku"
              type="text"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              required
              placeholder="SKU-001"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="brand"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Brand
            </label>

            <input
              id="brand"
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Enter brand"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Price
            </label>

            <input
              id="price"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="discount_price"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Discount price
            </label>

            <input
              id="discount_price"
              type="number"
              min="0"
              step="0.01"
              value={discountPrice}
              onChange={(event) => setDiscountPrice(event.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Stock quantity
            </label>

            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={stockQty}
              onChange={(event) => setStockQty(event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Description
          </label>

          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            placeholder="Enter product description"
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Current images */}
        {existingImages.length > 0 && (
          <div>
            <p className="mb-2 block text-sm font-semibold text-gray-700">
              Current images
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {existingImages.map((image, index) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="h-36 w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Uploading new images below will replace these.
            </p>
          </div>
        )}

        {/* Product image upload section */}
        <div>
          <label
            htmlFor="images"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Replace product images
          </label>

          <input
            id="images"
            name="images"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            onChange={handleImageChange}
            className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#121358] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#1d1e75]"
          />

          <p className="mt-2 text-xs text-gray-500">
            Select JPG, JPEG, PNG, or WebP files. Maximum 8 images and 4 MB
            per image. The first image will be the primary image. Leave
            empty to keep the current images.
          </p>

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {imagePreviews.map((previewUrl, index) => (
                <div
                  key={previewUrl}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`New product preview ${index + 1}`}
                    className="h-36 w-full object-cover"
                  />

                  <div className="p-3">
                    {index === 0 && (
                      <p className="mb-1 text-xs font-semibold text-green-700">
                        Primary image
                      </p>
                    )}

                    <p className="truncate text-xs text-gray-600">
                      {images[index]?.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || categoriesLoading || categories.length === 0}
            className="rounded-xl bg-[#121358] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d1e75] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
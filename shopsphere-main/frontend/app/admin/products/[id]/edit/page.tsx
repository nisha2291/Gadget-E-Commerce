"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { adminApi } from "@/lib/api";
import type { Category } from "@/types";

export default function EditProductPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    brand: "",
    description: "",
    price: "",
    discount_price: "",
    stock_qty: "",
    category_id: "",
    category_ids: [] as number[],
    specifications: "",
  });

  useEffect(() => {
    Promise.all([adminApi.products.get(id), adminApi.categories.list()])
      .then(([product, cats]) => {
        setCategories(cats);
        setForm({
          name: product.name,
          slug: product.slug,
          brand: product.brand || "",
          description: product.description || "",
          price: String(product.price),
          discount_price: product.discount_price ? String(product.discount_price) : "",
          stock_qty: String(product.stock_qty ?? 0),
          category_id: product.category_id ? String(product.category_id) : "",
          category_ids: product.categories?.map((c) => c.id) || [],
          specifications: product.specifications
            ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join("\n")
            : "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let specifications: Record<string, string> | undefined;
      if (form.specifications.trim()) {
        specifications = {};
        form.specifications.split("\n").forEach((line) => {
          const [key, ...rest] = line.split(":");
          if (key && rest.length) specifications![key.trim()] = rest.join(":").trim();
        });
      }

      await adminApi.products.update(id, {
        name: form.name,
        slug: form.slug,
        brand: form.brand,
        description: form.description,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock_qty: Number(form.stock_qty),
        category_id: form.category_id ? Number(form.category_id) : null,
        category_ids: form.category_ids,
        specifications,
      });
      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-primary hover:text-secondary">
        ← Back to products
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Edit Product</h1>

      <Card className="mt-8 max-w-2xl" padding="md">
        <CardHeader title="Product Details" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Discount Price" type="number" step="0.01" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
            <Input label="Stock Qty" type="number" required value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
            <div>
              <label className="mb-1 block text-sm font-medium">Primary Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Additional Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.category_ids.includes(cat.id)}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        category_ids: e.target.checked
                          ? [...form.category_ids, cat.id]
                          : form.category_ids.filter((cid) => cid !== cat.id),
                      });
                    }}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Specifications (key: value per line)</label>
            <textarea
              rows={4}
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm"
            />
          </div>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}

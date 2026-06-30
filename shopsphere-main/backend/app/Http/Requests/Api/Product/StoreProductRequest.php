<?php

namespace App\Http\Requests\Api\Product;

use App\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Allow the request.
     *
     * Access control is already handled by the
     * auth:sanctum and admin route middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for updating a product.
     */
    public function rules(): array
    {
        $product = $this->route('product');

        $productId = is_object($product)
            ? $product->id
            : $product;

        return [
            /*
            |--------------------------------------------------------------------------
            | Product categories
            |--------------------------------------------------------------------------
            */

            'category_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'category_ids' => [
                'sometimes',
                'nullable',
                'array',
            ],

            'category_ids.*' => [
                'integer',
                'distinct',
                'exists:categories,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Basic product information
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($productId),
            ],

            'brand' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | Product price and stock
            |--------------------------------------------------------------------------
            */

            'price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'discount_price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'lte:price',
            ],

            'stock_qty' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | Product status
            |--------------------------------------------------------------------------
            */

            'status' => [
                'sometimes',
                'required',
                Rule::enum(ProductStatus::class),
            ],

            /*
            |--------------------------------------------------------------------------
            | Product specifications
            |--------------------------------------------------------------------------
            */

            'specifications' => [
                'sometimes',
                'nullable',
                'array',
            ],

            'specifications.*' => [
                'nullable',
            ],

            /*
            |--------------------------------------------------------------------------
            | Warranty and SKU
            |--------------------------------------------------------------------------
            */

            'warranty_months' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
                'max:240',
            ],

            'sku' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Product images
            |--------------------------------------------------------------------------
            |
            | Sending new image files replaces the existing images.
            | This matches StoreProductRequest's file-upload rules
            | so the edit form can re-use the same images[] input.
            |
            | NOTE: if you still need to support the old JSON-based
            | image syncing (image_path/is_primary objects) for any
            | other client, that would need a separate field name
            | (e.g. "image_data") since a field can't be validated
            | as both a file and an array of objects at the same time.
            |
            */

            'images' => [
                'sometimes',
                'nullable',
                'array',
                'max:8',
            ],

            'images.*' => [
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],

            /*
            |--------------------------------------------------------------------------
            | Product variants
            |--------------------------------------------------------------------------
            |
            | Sending variants replaces the existing variants.
            |
            */

            'variants' => [
                'sometimes',
                'nullable',
                'array',
            ],

            'variants.*' => [
                'array',
            ],

            'variants.*.variant_name' => [
                'required',
                'string',
                'max:100',
            ],

            'variants.*.variant_value' => [
                'required',
                'string',
                'max:100',
            ],

            'variants.*.price_adjustment' => [
                'sometimes',
                'nullable',
                'numeric',
            ],

            'variants.*.stock_qty' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'variants.*.sku' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The product name is required.',
            'price.required' => 'The product price is required.',
            'price.min' => 'The product price cannot be negative.',

            'discount_price.lte' =>
                'The discount price must be less than or equal to the regular price.',

            'stock_qty.required' =>
                'The product stock quantity is required.',

            'stock_qty.min' =>
                'The product stock quantity cannot be negative.',

            'category_id.exists' =>
                'The selected product category does not exist.',

            'category_ids.*.exists' =>
                'One or more selected product categories do not exist.',

            'slug.unique' =>
                'Another product is already using this slug.',

            'sku.unique' =>
                'Another product is already using this SKU.',

            'images.max' =>
                'You may upload a maximum of 8 images.',

            'images.*.image' =>
                'Every uploaded file must be an image.',

            'images.*.mimes' =>
                'Images must be JPG, JPEG, PNG, or WebP.',

            'images.*.max' =>
                'Each image must not be larger than 4 MB.',

            'variants.*.variant_name.required' =>
                'Every variant must contain a variant name.',

            'variants.*.variant_value.required' =>
                'Every variant must contain a variant value.',
        ];
    }
}
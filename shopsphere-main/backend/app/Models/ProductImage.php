<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_path',
        'alt_text',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'url',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
public function getUrlAttribute(): string
{
    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($this->image_path)) {
        return asset('storage/'.$this->image_path);
    }

    return 'https://placehold.co/400x400?text='.urlencode($this->alt_text ?? 'Product');
}
}
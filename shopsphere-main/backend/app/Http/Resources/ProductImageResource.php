<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_path' => $this->image_path,
            'url' => Storage::disk('public')->exists($this->image_path)
                ? asset('storage/' . ltrim($this->image_path, '/'))
                : 'https://placehold.co/400x400?text=' . urlencode($this->alt_text ?? 'Product'),
            'is_primary' => $this->is_primary,
        ];
    }
}

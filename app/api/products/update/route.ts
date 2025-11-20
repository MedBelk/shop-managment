// app/api/products/update/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

type IncomingImage = {
  id?: number;
  position?: number;
};

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, category, country, quality, year, images } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (name) updateData.name = name;
    if (price) updateData.regular_price = price.toString();

    // Handle categories
    if (category) {
      // You might need to fetch category ID first
      updateData.categories = [{ name: category }];
    }

    // Update attributes if provided
    const attributes: Array<{ id: number; name: string; visible: boolean; options: string[] }> = [];
    
    if (country) {
      attributes.push({
        id: 6,
        name: 'Country',
        visible: true,
        options: [country]
      });
    }
    
    if (quality) {
      attributes.push({
        id: 8,
        name: 'Quality',
        visible: true,
        options: [quality]
      });
    }
    
    if (year) {
      attributes.push({
        id: 7,
        name: 'Issue Year',
        visible: true,
        options: [year]
      });
    }

    if (attributes.length > 0) {
      updateData.attributes = attributes;
    }

    if (Array.isArray(images) && images.length > 0) {
      const sanitizedImages = (images as IncomingImage[])
        .filter((img) => typeof img?.id === 'number')
        .map((img, index) => ({
          id: img.id,
          position: typeof img.position === 'number' ? img.position : index
        }));

      if (sanitizedImages.length > 0) {
        updateData.images = sanitizedImages;
      }
    }

    console.log('Updating product with data:', updateData);

    // Update product via WooCommerce API
    const updatedProduct = await fetchWooCommerce(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

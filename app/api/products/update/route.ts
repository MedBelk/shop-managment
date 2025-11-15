// app/api/products/update/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, category, country, quality, year } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (price) updateData.regular_price = price.toString();

    // Handle categories
    if (category) {
      // You might need to fetch category ID first
      updateData.categories = [{ name: category }];
    }

    // Update attributes if provided
    const attributes = [];
    
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

    console.log('Updating product with data:', updateData);

    // Update product via WooCommerce API
    const updatedProduct = await fetchWooCommerce(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

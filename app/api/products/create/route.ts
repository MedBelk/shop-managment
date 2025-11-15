// app/api/products/create/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Creating new product:', body);
    
    const { name, country, quality, year, status = 'private', imageIds = [] } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Prepare product data
    const productData: any = {
      name,
      type: 'simple',
      status: status,
      regular_price: '0',
      attributes: []
    };

    // Add images with proper structure
    if (imageIds.length > 0) {
      productData.images = [];
      
      // First image (front) - main product image
      if (imageIds[0]) {
        productData.images.push({
          id: imageIds[0],
          position: 0
        });
        console.log('✅ Added front image:', imageIds[0]);
      }
      
      // Second image (back) - gallery image
      if (imageIds[1]) {
        productData.images.push({
          id: imageIds[1],
          position: 1
        });
        console.log('✅ Added back image:', imageIds[1]);
      }
      
      console.log('📷 Total images to attach:', productData.images.length);
    } else {
      console.log('⚠️ No images provided');
    }

    // Add attributes
    if (country) {
      productData.attributes.push({
        id: 6,
        name: 'Country',
        visible: true,
        options: [country]
      });
    }

    if (quality) {
      productData.attributes.push({
        id: 8,
        name: 'Quality',
        visible: true,
        options: [quality]
      });
    }

    if (year) {
      productData.attributes.push({
        id: 7,
        name: 'Issue Year',
        visible: true,
        options: [year]
      });
    }

    console.log('📤 Sending to WooCommerce:', JSON.stringify(productData, null, 2));

    // Create product via WooCommerce API
    const newProduct = await fetchWooCommerce('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });

    console.log('✅ Product created with ID:', newProduct.id);
    console.log('📷 Product images:', newProduct.images);
    
    return NextResponse.json({ 
      success: true, 
      product: newProduct 
    });
    
  } catch (error: any) {
    console.error('❌ Create error:', error.message);
    
    // More detailed error logging
    if (error.response) {
      console.error('Error response:', await error.response.text());
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create product'
      },
      { status: 500 }
    );
  }
}

// app/api/products/delete/route.ts
import { fetchWooCommerce } from '@/lib/woocommerce';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting product ID: ${id}`);

    // Delete product using WooCommerce API with force=true to permanently delete
    const result = await fetchWooCommerce(`/products/${id}?force=true`, {
      method: 'DELETE'
    });

    console.log(`✅ Product ${id} deleted successfully`);

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully',
      product: result 
    });
    
  } catch (error: any) {
    console.error('❌ Delete error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

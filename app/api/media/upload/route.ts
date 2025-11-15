// app/api/media/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading image:', file.name);

    // Create new FormData for WordPress
    const wpFormData = new FormData();
    wpFormData.append('file', file);

    // Use custom WordPress endpoint
    const response = await fetch(`${WP_URL}/wp-json/custom/v1/upload-image`, {
      method: 'POST',
      body: wpFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Image uploaded:', data.id);

    return NextResponse.json({
      success: true,
      id: data.id,
      url: data.url
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

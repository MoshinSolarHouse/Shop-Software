// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/mongodb';
// import Purchase from '@/lib/models/Purchase';
// import Product from '@/lib/models/Product';
// import Payment from '@/lib/models/Payment';
// import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const user = getUserFromRequest(req);
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
//     await connectDB();
//     const purchase = await Purchase.findById(params.id).populate('supplierId items.productId');
    
//     if (!purchase) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
//     if (!canAccessShop(user, purchase.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     return NextResponse.json({ success: true, data: purchase });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const user = getUserFromRequest(req);
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     if (!hasPermission(user, 'purchases', 'update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     await connectDB();
//     const purchase = await Purchase.findById(params.id);
    
//     if (!purchase) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
//     if (!canAccessShop(user, purchase.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     const body = await req.json();
    
//     // Build update data - only allow certain fields to be updated
//     const updateData: any = {};
    
//     if (body.notes !== undefined) {
//       updateData.notes = body.notes;
//     }
    
//     if (body.status !== undefined) {
//       updateData.status = body.status;
//     }
    
//     // If paidAmount is being updated manually (correction/adjustment)
//     if (body.paidAmount !== undefined) {
//       const newPaidAmount = Number(body.paidAmount) || 0;
      
//       // Validate paid amount doesn't exceed total
//       if (newPaidAmount < 0) {
//         return NextResponse.json({ success: false, message: 'Paid amount cannot be negative' }, { status: 400 });
//       }
      
//       if (newPaidAmount > purchase.totalAmount) {
//         return NextResponse.json({
//           success: false,
//           message: `Paid amount (${newPaidAmount}) cannot exceed total amount (${purchase.totalAmount})`,
//         }, { status: 400 });
//       }
      
//       updateData.paidAmount = newPaidAmount;
//       const newDueAmount = purchase.totalAmount - newPaidAmount;
//       updateData.dueAmount = newDueAmount;
      
//       // Auto-set status based on payment
//       if (newDueAmount <= 0) {
//         updateData.status = 'paid';
//       } else if (newPaidAmount > 0) {
//         updateData.status = 'unpaid'; // Has partial payment
//       }
//     }
    
//     const updated = await Purchase.findByIdAndUpdate(params.id, updateData, { new: true }).populate('supplierId items.productId');
    
//     return NextResponse.json({ success: true, data: updated });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }
    
//     return NextResponse.json({ success: true, data: updated });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const user = getUserFromRequest(req);
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     if (!hasPermission(user, 'purchases', 'delete')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     await connectDB();
//     const purchase = await Purchase.findById(params.id);
    
//     if (!purchase) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
//     if (!canAccessShop(user, purchase.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     // Revert product stock changes - CRITICAL: this is the inverse of creation
//     const revertedProducts: any[] = [];
//     for (const item of purchase.items) {
//       try {
//         const product = await Product.findById(item.productId);
//         if (!product) {
//           console.error(`Product ${item.productId} not found for revert`);
//           continue;
//         }
        
//         // Revert stock: subtract the purchased quantity
//         const revertedQty = Number(item.qty) || 0;
//         const updatedProduct = await Product.findByIdAndUpdate(
//           item.productId,
//           {
//             $inc: { stock: -revertedQty },
//             updatedAt: new Date(),
//           },
//           { new: true }
//         );
        
//         revertedProducts.push({
//           productId: item.productId,
//           productName: product.name,
//           qtyReverted: revertedQty,
//           newStock: updatedProduct?.stock,
//         });
//       } catch (err: any) {
//         console.error(`Failed to revert product ${item.productId}:`, err.message);
//       }
//     }
    
//     // Delete associated payments
//     const deletedPayments = await Payment.deleteMany({
//       referenceId: params.id,
//       referenceType: 'purchase',
//     });
    
//     // Delete purchase
//     await Purchase.findByIdAndDelete(params.id);
    
//     return NextResponse.json({
//       success: true,
//       message: 'Purchase deleted and stock reverted',
//       revertedProducts,
//       deletedPaymentsCount: deletedPayments.deletedCount,
//     });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }




import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/lib/models/Purchase';
import Product from '@/lib/models/Product';
import Payment from '@/lib/models/Payment';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

/**
 * GET SINGLE PURCHASE
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const purchase = await Purchase.findById(params.id).populate('supplierId items.productId');

    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }

    if (!canAccessShop(user, purchase.shopId.toString())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: purchase });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * UPDATE PURCHASE
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'purchases', 'update')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();

    const existing = await Purchase.findById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }

    if (!canAccessShop(user, existing.shopId.toString())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const updated = await Purchase.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * DELETE PURCHASE
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'purchases', 'delete')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const purchase = await Purchase.findById(params.id);

    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }

    if (!canAccessShop(user, purchase.shopId.toString())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await Purchase.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Purchase deleted successfully',
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
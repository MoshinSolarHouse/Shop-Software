// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/mongodb';
// import Purchase from '@/lib/models/Purchase';
// import Product from '@/lib/models/Product';
// import Payment from '@/lib/models/Payment';
// import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

// export async function GET(req: NextRequest) {
//   try {
//     const user = getUserFromRequest(req);
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     await connectDB();
    
//     const shopId = req.nextUrl.searchParams.get('shopId');
//     const supplierId = req.nextUrl.searchParams.get('supplierId');
//     const dateFrom = req.nextUrl.searchParams.get('dateFrom');
//     const dateTo = req.nextUrl.searchParams.get('dateTo');
    
//     if (!shopId) return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
//     if (!canAccessShop(user, shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     const filter: any = { shopId };
//     if (supplierId) filter.supplierId = supplierId;
//     if (dateFrom) filter.date = { ...filter.date, $gte: dateFrom };
//     if (dateTo) filter.date = { ...filter.date, $lte: dateTo };
    
//     const purchases = await Purchase.find(filter)
//       .populate('supplierId items.productId')
//       .sort({ createdAt: -1 });
    
//     return NextResponse.json({ success: true, data: purchases });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const user = getUserFromRequest(req);
//     if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//     if (!hasPermission(user, 'purchases', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
//     await connectDB();
//     const body = await req.json();
    
//     if (!canAccessShop(user, body.shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
//     if (!body.supplierId) return NextResponse.json({ success: false, message: 'Supplier is required' }, { status: 400 });
//     if (!body.items || body.items.length === 0) return NextResponse.json({ success: false, message: 'At least one item is required' }, { status: 400 });
    
//     body.createdBy = user.userId;
    
//     // Calculate totalAmount from items
//     let totalAmount = 0;
//     body.items.forEach((item: any) => {
//       item.total = item.qty * item.unitPrice;
//       totalAmount += item.total;
//     });
    
//     body.totalAmount = totalAmount;
//     body.paidAmount = body.paidAmount || 0;
//     body.dueAmount = totalAmount - body.paidAmount;
//     body.status = body.paidAmount >= totalAmount ? 'paid' : 'unpaid';
    
//     // Create purchase
//     const purchase = await Purchase.create(body);
    
//     // Update products: CRITICAL - ensure stock and cost price sync correctly
//     const productUpdates: any[] = [];
//     for (const item of body.items) {
//       try {
//         const product = await Product.findById(item.productId);
//         if (!product) {
//           console.error(`Product ${item.productId} not found for purchase`);
//           continue;
//         }
        
//         // Calculate weighted average cost price
//         // newCostPrice = (oldStock * oldCostPrice + newQty * newUnitPrice) / (oldStock + newQty)
//         const oldStock = product.stock || 0;
//         const oldCostPrice = product.costPrice || 0;
//         const newQty = Number(item.qty) || 0;
//         const newUnitPrice = Number(item.unitPrice) || 0;
        
//         let newCostPrice = newUnitPrice; // If oldStock is 0, use new price
//         if (oldStock > 0) {
//           const totalCost = (oldStock * oldCostPrice) + (newQty * newUnitPrice);
//           newCostPrice = totalCost / (oldStock + newQty);
//         }
        
//         // Update product with both stock and cost price - using separate update to ensure both apply
//         const updated = await Product.findByIdAndUpdate(
//           item.productId,
//           {
//             $inc: { stock: newQty },
//             costPrice: Number(newCostPrice.toFixed(2)),
//             updatedAt: new Date(),
//           },
//           { new: true }
//         );
        
//         productUpdates.push({
//           productId: item.productId,
//           productName: product.name,
//           qtyAdded: newQty,
//           newStock: updated?.stock,
//           oldCostPrice,
//           newCostPrice: updated?.costPrice,
//         });
//       } catch (err: any) {
//         console.error(`Failed to update product ${item.productId}:`, err.message);
//       }
//     }
    
//     // Create payment record if amount was paid during purchase
//     if (body.paidAmount > 0) {
//       try {
//         await Payment.create({
//           shopId: body.shopId,
//           partyId: body.supplierId,
//           partyType: 'supplier',
//           referenceType: 'purchase',
//           referenceId: purchase._id,
//           amount: body.paidAmount,
//           method: body.paymentMethod || 'cash',
//           date: body.date,
//           notes: `Payment for purchase ${purchase.referenceNo || purchase._id}`,
//           createdBy: user.userId,
//         });
//       } catch (err: any) {
//         console.error('Failed to create payment record:', err.message);
//         // Don't fail the purchase if payment record fails, log and continue
//       }
//     }
    
//     return NextResponse.json({ success: true, data: purchase, productUpdates }, { status: 201 });
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
 * GET PURCHASES LIST
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const shopId = req.nextUrl.searchParams.get('shopId');
    const supplierId = req.nextUrl.searchParams.get('supplierId');

    if (!shopId) {
      return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
    }

    if (!canAccessShop(user, shopId)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const filter: any = { shopId };
    if (supplierId) filter.supplierId = supplierId;

    const purchases = await Purchase.find(filter)
      .populate('supplierId items.productId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: purchases });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * CREATE PURCHASE
 */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'purchases', 'create')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();

    if (!canAccessShop(user, body.shopId)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (!body.supplierId || !body.items?.length) {
      return NextResponse.json({ success: false, message: 'Supplier & items required' }, { status: 400 });
    }

    body.createdBy = user.userId;

    // =========================
    // CALCULATE TOTAL
    // =========================
    let totalAmount = 0;

    body.items.forEach((item: any) => {
      item.total = item.qty * item.unitPrice;
      totalAmount += item.total;
    });

    body.totalAmount = totalAmount;
    body.paidAmount = body.paidAmount || 0;
    body.dueAmount = totalAmount - body.paidAmount;
    body.status = body.dueAmount <= 0 ? 'paid' : 'unpaid';

    // =========================
    // CREATE PURCHASE
    // =========================
    const purchase = await Purchase.create(body);

    // =========================
    // SYNC PRODUCTS (STOCK + COST PRICE)
    // =========================
    for (const item of body.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const oldStock = product.stock || 0;
      const oldCost = product.costPrice || 0;

      const newQty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);

      // weighted avg cost price
      let newCostPrice = unitPrice;

      if (oldStock > 0) {
        newCostPrice =
          (oldStock * oldCost + newQty * unitPrice) / (oldStock + newQty);
      }

      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: newQty },
        costPrice: Number(newCostPrice.toFixed(2)),
      });
    }

    // =========================
    // CREATE PAYMENT (if paid)
    // =========================
    if (body.paidAmount > 0) {
      await Payment.create({
        shopId: body.shopId,
        partyId: body.supplierId,
        partyType: 'supplier',
        referenceType: 'purchase',
        referenceId: purchase._id,
        amount: body.paidAmount,
        method: body.paymentMethod || 'cash',
        date: body.date,
        createdBy: user.userId,
      });
    }

    return NextResponse.json({
      success: true,
      data: purchase,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
import ExcelJS    from 'exceljs';
import Order      from '../models/Order.js';
import transporter from '../config/mail.js';
import logger     from '../utils/logger.js';
import { ORDER_STATUS }   from '../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';

// ─── Colour palette (Varnam brand) ───────────────────────────────────────────
const C = {
  headerBg:      '1B4332',
  headerFont:    'FDF6EC',
  monthBg:       '2D6A4F',
  monthFont:     'FFFFFF',
  subHeaderBg:   'D8F3DC',
  subHeaderFont: '1B4332',
  altRow:        'F5FAF7',
  white:         'FFFFFF',
  amber:         'C8893A',
  amberLight:    'FEF3E2',
  red:           'DC2626',
  redLight:      'FEF2F2',
  green:         '065F46',
  greenLight:    'ECFDF5',
  border:        'D0C8B5',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

const fmtMoney = (n) =>
  n != null
    ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹0.00';

const monthKey  = (d) =>
  `${new Date(d).getFullYear()}-${String(new Date(d).getMonth() + 1).padStart(2, '0')}`;
const monthName = (key) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const borderCell = (cell) => {
  cell.border = {
    top:    { style: 'thin', color: { argb: C.border } },
    left:   { style: 'thin', color: { argb: C.border } },
    bottom: { style: 'thin', color: { argb: C.border } },
    right:  { style: 'thin', color: { argb: C.border } },
  };
};

const styleHeader = (row, bgArgb, fontArgb, bold = true) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.font      = { bold, color: { argb: fontArgb }, name: 'Calibri', size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    borderCell(cell);
  });
  row.height = 22;
};

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD RESOLVER
// Returns { start, end, label, fileLabel } for the requested period.
// All boundaries are in IST (UTC+5:30) then converted to UTC for the DB query.
// ─────────────────────────────────────────────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getISTMidnight = (date = new Date()) => {
  // Current time in IST
  const istNow   = new Date(date.getTime() + IST_OFFSET_MS);
  // Midnight IST today = floor to day then subtract offset to get UTC
  const midnight = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
    0, 0, 0, 0,
  ) - IST_OFFSET_MS);
  return midnight;
};

const resolvePeriod = (period = 'all') => {
  const now = new Date();

  if (period === 'today') {
    const start = getISTMidnight(now);         // today 00:00 IST
    const end   = now;                          // right now
    return {
      start,
      end,
      label:     `Today — ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}`,
      fileLabel: `Today_${now.toISOString().slice(0, 10)}`,
    };
  }

  if (period === 'week') {
    const midnight    = getISTMidnight(now);
    // IST day of week: 0=Sun…6=Sat; we want Monday as week start
    const istNow      = new Date(now.getTime() + IST_OFFSET_MS);
    const dayOfWeek   = istNow.getUTCDay();            // 0 Sun … 6 Sat
    const daysSinceMon = (dayOfWeek + 6) % 7;         // Mon=0 … Sun=6
    const weekStart   = new Date(midnight.getTime() - daysSinceMon * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
    const todayStr     = now.toLocaleDateString('en-IN',       { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
    return {
      start:     weekStart,
      end:       now,
      label:     `This Week — ${weekStartStr} to ${todayStr}`,
      fileLabel: `Week_${weekStart.toISOString().slice(0, 10)}_to_${now.toISOString().slice(0, 10)}`,
    };
  }

  if (period === 'month') {
    const istNow     = new Date(now.getTime() + IST_OFFSET_MS);
    // First day of current month, 00:00 IST → UTC
    const monthStart = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      1, 0, 0, 0, 0,
    ) - IST_OFFSET_MS);
    const monthStr   = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
    return {
      start:     monthStart,
      end:       now,
      label:     `${monthStr} (so far)`,
      fileLabel: `Month_${now.toISOString().slice(0, 7)}`,
    };
  }

  // 'all' — no date filter
  return {
    start:     null,
    end:       null,
    label:     'All Time',
    fileLabel: `AllTime_${now.toISOString().slice(0, 10)}`,
  };
};

// ─── Sheet 1: All Orders ──────────────────────────────────────────────────────
const buildOrdersSheet = (wb, orders, periodLabel) => {
  const ws = wb.addWorksheet('All Orders', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  ws.columns = [
    { header: 'Order Number',       key: 'orderNumber',       width: 26 },
    { header: 'Month',              key: 'month',             width: 14 },
    { header: 'Order Date',         key: 'orderDate',         width: 22 },
    { header: 'Customer Name',      key: 'customerName',      width: 22 },
    { header: 'Email',              key: 'customerEmail',     width: 28 },
    { header: 'Phone',              key: 'customerPhone',     width: 14 },
    { header: 'Account User',       key: 'isRegistered',      width: 13 },
    { header: 'Street',             key: 'street',            width: 26 },
    { header: 'City',               key: 'city',              width: 16 },
    { header: 'State',              key: 'state',             width: 16 },
    { header: 'Postal Code',        key: 'postalCode',        width: 12 },
    { header: 'Items Summary',      key: 'itemsSummary',      width: 38 },
    { header: 'Item Count',         key: 'itemCount',         width: 11 },
    { header: 'Subtotal',           key: 'subtotal',          width: 13 },
    { header: 'Shipping Fee',       key: 'shippingFee',       width: 13 },
    { header: 'Total',              key: 'totalPrice',        width: 13 },
    { header: 'Payment Method',     key: 'paymentMethod',     width: 16 },
    { header: 'Payment Status',     key: 'paymentStatus',     width: 16 },
    { header: 'Paid At',            key: 'paidAt',            width: 22 },
    { header: 'Razorpay Order ID',  key: 'razorpayOrderId',   width: 24 },
    { header: 'Razorpay Payment ID',key: 'razorpayPaymentId', width: 24 },
    { header: 'Refunded At',        key: 'refundedAt',        width: 22 },
    { header: 'Order Status',       key: 'orderStatus',       width: 22 },
    { header: 'Delivered At',       key: 'deliveredAt',       width: 22 },
    { header: 'Cancel Requested',   key: 'cancelRequested',   width: 16 },
    { header: 'Cancel Reason',      key: 'cancelReason',      width: 32 },
    { header: 'Cancel Status',      key: 'cancelStatus',      width: 14 },
    { header: 'Cancel Admin Note',  key: 'cancelAdminNote',   width: 28 },
    { header: 'Cancel Resolved At', key: 'cancelResolvedAt',  width: 22 },
  ];

  // Title row (row 1)
  ws.mergeCells(1, 1, 1, ws.columns.length);
  const titleCell    = ws.getCell(1, 1);
  titleCell.value    = `Varnam Naturals — Order Report  ·  Period: ${periodLabel}  ·  Generated: ${fmtDate(new Date())}`;
  titleCell.font     = { bold: true, size: 13, color: { argb: C.headerFont }, name: 'Calibri' };
  titleCell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Column header row (row 2)
  const headerRow   = ws.getRow(2);
  headerRow.values  = ws.columns.map(c => c.header);
  styleHeader(headerRow, C.subHeaderBg, C.subHeaderFont);
  ws.getRow(2).height = 28;

  // Group by month
  const byMonth = {};
  for (const o of orders) {
    const k = monthKey(o.createdAt);
    if (!byMonth[k]) byMonth[k] = [];
    byMonth[k].push(o);
  }

  const sortedMonths = Object.keys(byMonth).sort();
  let rowIdx = 3;

  for (const mk of sortedMonths) {
    const monthOrders = byMonth[mk];

    // Month separator row
    const sepRow = ws.getRow(rowIdx++);
    ws.mergeCells(rowIdx - 1, 1, rowIdx - 1, ws.columns.length);
    const sepCell   = ws.getCell(rowIdx - 1, 1);
    sepCell.value   = `▸  ${monthName(mk)}  —  ${monthOrders.length} order${monthOrders.length !== 1 ? 's' : ''}  ·  Revenue: ${fmtMoney(monthOrders.reduce((s, o) => s + (o.totalPrice || 0), 0))}`;
    sepCell.font    = { bold: true, size: 10, color: { argb: C.monthFont }, name: 'Calibri' };
    sepCell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.monthBg } };
    sepCell.alignment = { vertical: 'middle', indent: 1 };
    sepRow.height   = 20;

    monthOrders.forEach((o, i) => {
      const cr  = o.cancellationRequest;
      const alt = i % 2 === 1;

      const dataRow   = ws.getRow(rowIdx++);
      dataRow.values  = {
        orderNumber:       o.orderNumber,
        month:             monthName(mk),
        orderDate:         fmtDate(o.createdAt),
        customerName:      o.customerName,
        customerEmail:     o.customerEmail,
        customerPhone:     o.customerPhone,
        isRegistered:      o.user ? 'Yes' : 'Guest',
        street:            o.shippingAddress?.street     || '',
        city:              o.shippingAddress?.city       || '',
        state:             o.shippingAddress?.state      || '',
        postalCode:        o.shippingAddress?.postalCode || '',
        itemsSummary:      o.orderItems.map(it => `${it.name} ×${it.quantity}`).join(' | '),
        itemCount:         o.orderItems.reduce((s, it) => s + it.quantity, 0),
        subtotal:          o.subtotal,
        shippingFee:       o.shippingFee,
        totalPrice:        o.totalPrice,
        paymentMethod:     o.paymentMethod,
        paymentStatus:     o.paymentStatus,
        paidAt:            fmtDate(o.paidAt),
        razorpayOrderId:   o.razorpayOrderId   || '—',
        razorpayPaymentId: o.razorpayPaymentId || '—',
        refundedAt:        fmtDate(o.refundedAt),
        orderStatus:       o.orderStatus,
        deliveredAt:       fmtDate(o.deliveredAt),
        cancelRequested:   cr?.requestedAt ? fmtDate(cr.requestedAt) : 'No',
        cancelReason:      cr?.reason      || '—',
        cancelStatus:      cr?.status      || '—',
        cancelAdminNote:   cr?.adminNote   || '—',
        cancelResolvedAt:  fmtDate(cr?.resolvedAt),
      };

      const bgArgb = alt ? C.altRow : C.white;

      dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.font      = { name: 'Calibri', size: 9.5, color: { argb: '26221C' } };
        cell.alignment = { vertical: 'middle', wrapText: false };
        borderCell(cell);

        if (colNum === 19) {   // paymentStatus
          const ps = o.paymentStatus;
          if (ps === PAYMENT_STATUS.PAID)     { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.greenLight } }; cell.font = { ...cell.font, color: { argb: C.green }, bold: true }; }
          if (ps === PAYMENT_STATUS.REFUNDED) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.amberLight } }; cell.font = { ...cell.font, color: { argb: C.amber }, bold: true }; }
          if (ps === PAYMENT_STATUS.FAILED)   { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.redLight } };   cell.font = { ...cell.font, color: { argb: C.red },   bold: true }; }
        }
        if (colNum === 23) {   // orderStatus
          const os = o.orderStatus;
          if (os === ORDER_STATUS.DELIVERED) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.greenLight } }; cell.font = { ...cell.font, color: { argb: C.green }, bold: true }; }
          if (os === ORDER_STATUS.CANCELLED) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.redLight } };   cell.font = { ...cell.font, color: { argb: C.red },   bold: true }; }
          if (os === ORDER_STATUS.SHIPPED || os === ORDER_STATUS.OUT_FOR_DELIVERY) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.amberLight } };
            cell.font = { ...cell.font, color: { argb: C.amber }, bold: true };
          }
        }
        if ([14, 15, 16].includes(colNum)) {
          cell.numFmt   = '₹#,##0.00';
          cell.alignment = { ...cell.alignment, horizontal: 'right' };
        }
      });

      dataRow.height = 18;
    });
  }

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: ws.columns.length } };
};

// ─── Sheet 2: Monthly Summary ─────────────────────────────────────────────────
const buildMonthlySummarySheet = (wb, orders, periodLabel) => {
  const ws = wb.addWorksheet('Monthly Summary', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Month',               key: 'month',        width: 18 },
    { header: 'Total Orders',        key: 'total',        width: 14 },
    { header: 'Revenue (₹)',         key: 'revenue',      width: 16 },
    { header: 'Avg Order Value (₹)', key: 'avgOrder',     width: 18 },
    { header: 'Delivered',           key: 'delivered',    width: 12 },
    { header: 'Cancelled',           key: 'cancelled',    width: 12 },
    { header: 'COD Orders',          key: 'cod',          width: 12 },
    { header: 'Online Orders',       key: 'online',       width: 14 },
    { header: 'Refunded Orders',     key: 'refunded',     width: 15 },
    { header: 'Cancel Requests',     key: 'cancelReqs',   width: 16 },
    { header: 'Unique Customers',    key: 'newCustomers', width: 15 },
    { header: 'Guest Orders',        key: 'guestOrders',  width: 13 },
  ];

  ws.mergeCells(1, 1, 1, ws.columns.length);
  const t     = ws.getCell(1, 1);
  t.value     = `Monthly Performance Summary  ·  Period: ${periodLabel}`;
  t.font      = { bold: true, size: 13, color: { argb: C.headerFont }, name: 'Calibri' };
  t.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const hr   = ws.getRow(2);
  hr.values  = ws.columns.map(c => c.header);
  styleHeader(hr, C.subHeaderBg, C.subHeaderFont);

  const byMonth = {};
  for (const o of orders) {
    const k = monthKey(o.createdAt);
    if (!byMonth[k]) byMonth[k] = { total: 0, revenue: 0, delivered: 0, cancelled: 0, cod: 0, online: 0, refunded: 0, cancelReqs: 0, uniqueUsers: new Set(), guestOrders: 0 };
    const m = byMonth[k];
    m.total++;
    m.revenue += o.totalPrice || 0;
    if (o.orderStatus === ORDER_STATUS.DELIVERED)    m.delivered++;
    if (o.orderStatus === ORDER_STATUS.CANCELLED)    m.cancelled++;
    if (o.paymentMethod === 'COD')                   m.cod++;
    else                                             m.online++;
    if (o.paymentStatus === PAYMENT_STATUS.REFUNDED) m.refunded++;
    if (o.cancellationRequest?.requestedAt)          m.cancelReqs++;
    if (o.user) m.uniqueUsers.add(String(o.user));
    else        m.guestOrders++;
  }

  const sortedMonths = Object.keys(byMonth).sort();
  let rowIdx = 3;
  let grandRevenue = 0, grandOrders = 0, grandDelivered = 0, grandCancelled = 0;

  sortedMonths.forEach((mk, i) => {
    const m   = byMonth[mk];
    const alt = i % 2 === 1;
    grandRevenue   += m.revenue;
    grandOrders    += m.total;
    grandDelivered += m.delivered;
    grandCancelled += m.cancelled;

    const row   = ws.getRow(rowIdx++);
    row.values  = {
      month:        monthName(mk),
      total:        m.total,
      revenue:      m.revenue,
      avgOrder:     m.total > 0 ? m.revenue / m.total : 0,
      delivered:    m.delivered,
      cancelled:    m.cancelled,
      cod:          m.cod,
      online:       m.online,
      refunded:     m.refunded,
      cancelReqs:   m.cancelReqs,
      newCustomers: m.uniqueUsers.size,
      guestOrders:  m.guestOrders,
    };

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? C.altRow : C.white } };
      cell.font      = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'right' };
      borderCell(cell);
      if ([3, 4].includes(colNum)) cell.numFmt = '₹#,##0.00';
    });
    row.height = 20;
  });

  // Totals row
  const totRow   = ws.getRow(rowIdx);
  totRow.values  = {
    month:     'TOTAL',
    total:     grandOrders,
    revenue:   grandRevenue,
    avgOrder:  grandOrders > 0 ? grandRevenue / grandOrders : 0,
    delivered: grandDelivered,
    cancelled: grandCancelled,
  };
  totRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.monthBg } };
    cell.font      = { bold: true, name: 'Calibri', size: 10, color: { argb: 'FFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'right' };
    borderCell(cell);
    if ([3, 4].includes(colNum)) cell.numFmt = '₹#,##0.00';
  });
  totRow.height = 22;
};

// ─── Sheet 3: Payment Detail ──────────────────────────────────────────────────
const buildPaymentSheet = (wb, orders, periodLabel) => {
  const ws = wb.addWorksheet('Payment Detail', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Order Number',        key: 'orderNumber',       width: 26 },
    { header: 'Month',               key: 'month',             width: 14 },
    { header: 'Order Date',          key: 'orderDate',         width: 22 },
    { header: 'Customer',            key: 'customerName',      width: 22 },
    { header: 'Payment Method',      key: 'paymentMethod',     width: 16 },
    { header: 'Payment Status',      key: 'paymentStatus',     width: 16 },
    { header: 'Subtotal',            key: 'subtotal',          width: 14 },
    { header: 'Shipping Fee',        key: 'shippingFee',       width: 14 },
    { header: 'Total',               key: 'totalPrice',        width: 14 },
    { header: 'Paid At',             key: 'paidAt',            width: 22 },
    { header: 'Razorpay Order ID',   key: 'razorpayOrderId',   width: 26 },
    { header: 'Razorpay Payment ID', key: 'razorpayPaymentId', width: 26 },
    { header: 'Refunded At',         key: 'refundedAt',        width: 22 },
    { header: 'Order Status',        key: 'orderStatus',       width: 20 },
  ];

  ws.mergeCells(1, 1, 1, ws.columns.length);
  const t     = ws.getCell(1, 1);
  t.value     = `Payment & Financial Detail  ·  Period: ${periodLabel}`;
  t.font      = { bold: true, size: 13, color: { argb: C.headerFont }, name: 'Calibri' };
  t.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const hr  = ws.getRow(2);
  hr.values = ws.columns.map(c => c.header);
  styleHeader(hr, C.subHeaderBg, C.subHeaderFont);

  orders.forEach((o, i) => {
    const row   = ws.getRow(i + 3);
    row.values  = {
      orderNumber:       o.orderNumber,
      month:             monthName(monthKey(o.createdAt)),
      orderDate:         fmtDate(o.createdAt),
      customerName:      o.customerName,
      paymentMethod:     o.paymentMethod,
      paymentStatus:     o.paymentStatus,
      subtotal:          o.subtotal,
      shippingFee:       o.shippingFee,
      totalPrice:        o.totalPrice,
      paidAt:            fmtDate(o.paidAt),
      razorpayOrderId:   o.razorpayOrderId   || '—',
      razorpayPaymentId: o.razorpayPaymentId || '—',
      refundedAt:        fmtDate(o.refundedAt),
      orderStatus:       o.orderStatus,
    };

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? C.altRow : C.white } };
      cell.font      = { name: 'Calibri', size: 9.5 };
      cell.alignment = { vertical: 'middle' };
      borderCell(cell);
      if ([7, 8, 9].includes(colNum)) {
        cell.numFmt   = '₹#,##0.00';
        cell.alignment = { ...cell.alignment, horizontal: 'right' };
      }
      if (colNum === 6) {
        if (o.paymentStatus === PAYMENT_STATUS.PAID)     { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.greenLight } }; cell.font = { ...cell.font, color: { argb: C.green }, bold: true }; }
        if (o.paymentStatus === PAYMENT_STATUS.REFUNDED) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.amberLight } }; cell.font = { ...cell.font, color: { argb: C.amber }, bold: true }; }
        if (o.paymentStatus === PAYMENT_STATUS.FAILED)   { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.redLight } };   cell.font = { ...cell.font, color: { argb: C.red },   bold: true }; }
      }
    });
    row.height = 17;
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: ws.columns.length } };
};

// ─── Sheet 4: Cancellations ───────────────────────────────────────────────────
const buildCancellationSheet = (wb, orders, periodLabel) => {
  const cancelled = orders.filter(
    o => o.orderStatus === ORDER_STATUS.CANCELLED || o.cancellationRequest?.requestedAt
  );

  const ws = wb.addWorksheet('Cancellations', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Order Number',         key: 'orderNumber',    width: 26 },
    { header: 'Month',                key: 'month',          width: 14 },
    { header: 'Order Date',           key: 'orderDate',      width: 22 },
    { header: 'Customer Name',        key: 'customerName',   width: 22 },
    { header: 'Customer Email',       key: 'customerEmail',  width: 28 },
    { header: 'Order Status',         key: 'orderStatus',    width: 20 },
    { header: 'Payment Method',       key: 'paymentMethod',  width: 16 },
    { header: 'Payment Status',       key: 'paymentStatus',  width: 16 },
    { header: 'Total (₹)',            key: 'totalPrice',     width: 14 },
    { header: 'Cancel Requested At',  key: 'cancelReqAt',    width: 22 },
    { header: 'Cancel Reason',        key: 'cancelReason',   width: 36 },
    { header: 'Cancel Status',        key: 'cancelStatus',   width: 14 },
    { header: 'Admin Note',           key: 'adminNote',      width: 30 },
    { header: 'Resolved At',          key: 'resolvedAt',     width: 22 },
    { header: 'Refunded At',          key: 'refundedAt',     width: 22 },
  ];

  ws.mergeCells(1, 1, 1, ws.columns.length);
  const t     = ws.getCell(1, 1);
  t.value     = `Cancellation & Refund Detail  ·  Period: ${periodLabel}  ·  ${cancelled.length} records`;
  t.font      = { bold: true, size: 13, color: { argb: C.headerFont }, name: 'Calibri' };
  t.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const hr  = ws.getRow(2);
  hr.values = ws.columns.map(c => c.header);
  styleHeader(hr, C.subHeaderBg, C.subHeaderFont);

  cancelled.forEach((o, i) => {
    const cr  = o.cancellationRequest || {};
    const row = ws.getRow(i + 3);
    row.values = {
      orderNumber:   o.orderNumber,
      month:         monthName(monthKey(o.createdAt)),
      orderDate:     fmtDate(o.createdAt),
      customerName:  o.customerName,
      customerEmail: o.customerEmail,
      orderStatus:   o.orderStatus,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      totalPrice:    o.totalPrice,
      cancelReqAt:   fmtDate(cr.requestedAt),
      cancelReason:  cr.reason    || '—',
      cancelStatus:  cr.status    || '—',
      adminNote:     cr.adminNote || '—',
      resolvedAt:    fmtDate(cr.resolvedAt),
      refundedAt:    fmtDate(o.refundedAt),
    };

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? C.altRow : C.white } };
      cell.font      = { name: 'Calibri', size: 9.5 };
      cell.alignment = { vertical: 'middle', wrapText: colNum === 11 };
      borderCell(cell);
      if (colNum === 9) { cell.numFmt = '₹#,##0.00'; cell.alignment = { ...cell.alignment, horizontal: 'right' }; }
      if (colNum === 12) {
        if (cr.status === 'Approved') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.greenLight } }; cell.font = { ...cell.font, color: { argb: C.green }, bold: true }; }
        if (cr.status === 'Rejected') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.redLight } };   cell.font = { ...cell.font, color: { argb: C.red },   bold: true }; }
        if (cr.status === 'Pending')  { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.amberLight } }; cell.font = { ...cell.font, color: { argb: C.amber }, bold: true }; }
      }
    });
    row.height = 18;
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: ws.columns.length } };
};

// ─── Sheet 5: Deliveries ──────────────────────────────────────────────────────
const buildDeliveriesSheet = (wb, orders, periodLabel) => {
  const delivered = orders.filter(o => o.orderStatus === ORDER_STATUS.DELIVERED);

  const ws = wb.addWorksheet('Deliveries', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Order Number',    key: 'orderNumber',   width: 26 },
    { header: 'Month',           key: 'month',         width: 14 },
    { header: 'Order Date',      key: 'orderDate',     width: 22 },
    { header: 'Delivered At',    key: 'deliveredAt',   width: 22 },
    { header: 'Days to Deliver', key: 'daysToDeliver', width: 15 },
    { header: 'Customer Name',   key: 'customerName',  width: 22 },
    { header: 'Customer Email',  key: 'customerEmail', width: 28 },
    { header: 'City',            key: 'city',          width: 16 },
    { header: 'State',           key: 'state',         width: 16 },
    { header: 'Payment Method',  key: 'paymentMethod', width: 16 },
    { header: 'Total (₹)',       key: 'totalPrice',    width: 14 },
    { header: 'Items',           key: 'itemsSummary',  width: 40 },
  ];

  ws.mergeCells(1, 1, 1, ws.columns.length);
  const t     = ws.getCell(1, 1);
  t.value     = `Delivery Records  ·  Period: ${periodLabel}  ·  ${delivered.length} orders delivered`;
  t.font      = { bold: true, size: 13, color: { argb: C.headerFont }, name: 'Calibri' };
  t.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const hr  = ws.getRow(2);
  hr.values = ws.columns.map(c => c.header);
  styleHeader(hr, C.subHeaderBg, C.subHeaderFont);

  delivered.forEach((o, i) => {
    const days = o.deliveredAt
      ? Math.ceil((new Date(o.deliveredAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24))
      : '—';

    const row   = ws.getRow(i + 3);
    row.values  = {
      orderNumber:   o.orderNumber,
      month:         monthName(monthKey(o.createdAt)),
      orderDate:     fmtDate(o.createdAt),
      deliveredAt:   fmtDate(o.deliveredAt),
      daysToDeliver: days,
      customerName:  o.customerName,
      customerEmail: o.customerEmail,
      city:          o.shippingAddress?.city  || '',
      state:         o.shippingAddress?.state || '',
      paymentMethod: o.paymentMethod,
      totalPrice:    o.totalPrice,
      itemsSummary:  o.orderItems.map(it => `${it.name} ×${it.quantity}`).join(' | '),
    };

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? C.altRow : C.white } };
      cell.font      = { name: 'Calibri', size: 9.5 };
      cell.alignment = { vertical: 'middle' };
      borderCell(cell);
      if (colNum === 11) { cell.numFmt = '₹#,##0.00'; cell.alignment = { ...cell.alignment, horizontal: 'right' }; }
      if (colNum === 5 && typeof days === 'number' && days <= 3) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.greenLight } };
        cell.font = { ...cell.font, color: { argb: C.green }, bold: true };
      }
    });
    row.height = 17;
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: ws.columns.length } };
};

// ─── Main controller ──────────────────────────────────────────────────────────
// @desc   Generate order report Excel and email to admin
// @route  GET /api/admin/reports/orders?period=all|month|week|today
// @access Private/Admin
//
// period param:
//   all   (default) — every order ever
//   month           — 1st of current month 00:00 IST → now
//   week            — last Monday 00:00 IST → now
//   today           — today 00:00 IST → now
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderReport = async (req, res) => {
  try {
    const period = ['all', 'month', 'week', 'today'].includes(req.query.period)
      ? req.query.period
      : 'all';

    const { start, end, label: periodLabel, fileLabel } = resolvePeriod(period);

    // ── DB query — date filter applied at the database level ─────────────────
    const matchStage = {
      orderStatus: { $ne: ORDER_STATUS.PENDING_PAYMENT },
    };
    if (start && end) {
      matchStage.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(matchStage)
      .sort({ createdAt: 1 })
      .populate('user', 'name email')
      .lean();

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: `No orders found for period: ${periodLabel}. Report not generated.`,
      });
    }

    // ── Build workbook ────────────────────────────────────────────────────────
    const wb      = new ExcelJS.Workbook();
    wb.creator    = 'Varnam Naturals Admin';
    wb.created    = new Date();
    wb.modified   = new Date();
    wb.properties.date1904 = false;

    buildOrdersSheet(wb, orders, periodLabel);
    buildMonthlySummarySheet(wb, orders, periodLabel);
    buildPaymentSheet(wb, orders, periodLabel);
    buildCancellationSheet(wb, orders, periodLabel);
    buildDeliveriesSheet(wb, orders, periodLabel);

    // ── Write to buffer ───────────────────────────────────────────────────────
    const buffer   = await wb.xlsx.writeBuffer();
    const now      = new Date();
    const reportDate = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
    });
    const filename = `Varnam_Orders_${fileLabel}.xlsx`;

    // ── Period badge for email ────────────────────────────────────────────────
    const periodBadgeColor = {
      all:   '#1B4332',
      month: '#2D6A4F',
      week:  '#1D4ED8',
      today: '#C8893A',
    }[period];

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e0d0;border-radius:8px;overflow:hidden;">
        <div style="background:#1B4332;padding:24px 28px;">
          <h2 style="color:#FDF6EC;margin:0;font-size:18px;">📊 Order Report Ready</h2>
          <p style="color:#95D5B2;margin:6px 0 0;font-size:13px;">Varnam Naturals — ${periodLabel}</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:#26221C;font-size:14px;">
            Your <strong>${periodLabel}</strong> order report is attached below.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <tr style="background:#f0f9f4;">
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;width:40%;">Period</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;">
                <span style="background:${periodBadgeColor};color:#fff;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:bold;">${period.toUpperCase()}</span>
                &nbsp;${periodLabel}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;">Generated</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;color:#26221C;">${reportDate}</td>
            </tr>
            <tr style="background:#f0f9f4;">
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;">Total Orders</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;color:#26221C;">${orders.length}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;">Revenue</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;color:#26221C;">${fmtMoney(orders.reduce((s, o) => s + (o.totalPrice || 0), 0))}</td>
            </tr>
            <tr style="background:#f0f9f4;">
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;">Sheets Included</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;color:#26221C;">All Orders · Monthly Summary · Payment Detail · Cancellations · Deliveries</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;font-weight:bold;color:#1B4332;">File Name</td>
              <td style="padding:10px 14px;border:1px solid #d0c8b5;color:#26221C;font-family:monospace;font-size:12px;">${filename}</td>
            </tr>
          </table>
          <p style="font-size:12px;color:#a89f8c;margin:0;">Data is current as of time of generation. All timestamps are in IST.</p>
        </div>
      </div>`;

    await transporter.sendMail({
      from:        `"Varnam Naturals" <${process.env.MAIL_FROM}>`,
      to:          process.env.ADMIN_EMAIL,
      subject:     `📊 Order Report [${period.toUpperCase()}] — ${periodLabel} (${orders.length} orders)`,
      html,
      attachments: [{
        filename,
        content:     buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }],
    });

    logger.info(`[Report] ${period} report sent to ${process.env.ADMIN_EMAIL} — ${orders.length} orders`);

    return res.status(200).json({
      success: true,
      message: `Report generated (${orders.length} orders, 5 sheets) and sent to ${process.env.ADMIN_EMAIL}.`,
      meta: {
        period,
        periodLabel,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + (o.totalPrice || 0), 0),
        filename,
        sentTo:      process.env.ADMIN_EMAIL,
        generatedAt: now.toISOString(),
        ...(start && { from: start.toISOString() }),
        ...(end   && { to:   end.toISOString()   }),
      },
    });

  } catch (error) {
    logger.error('[Report] Failed to generate order report', { error: error.message });
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate report',
    });
  }
};

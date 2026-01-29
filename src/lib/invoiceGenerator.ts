import { Booking, BanquetHall } from './types';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';

interface InvoiceData {
  booking: Booking;
  halls: BanquetHall[];
  customerName: string;
  customerEmail: string;
}

export const generateInvoice = (data: InvoiceData) => {
  const { booking, halls, customerName, customerEmail } = data;
  
  const hallNames = halls.map(h => h.name).join(', ');
  const totalHours = calculateHours(booking.start_time, booking.end_time);
  const pricePerHour = halls[0]?.price_per_hour || 0;
  const subtotal = booking.total_amount || 0;
  const gst = subtotal * 0.18; // 18% GST
  const advancePaid = booking.advance_amount || 0;
  const total = subtotal;
  const amenities = halls[0]?.amenities?.join(', ') || 'Premium amenities included';

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${booking.confirmation_number || booking.id.slice(0, 8).toUpperCase()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Lato', sans-serif;
      line-height: 1.6;
      color: #4a4a4a;
      background: #f8f8f8;
      padding: 40px 20px;
    }
    
    .invoice-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }
    
    .invoice-header {
      padding: 50px 60px 40px;
      background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
      border-bottom: 3px solid #8B4049;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .company-logo {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #8B4049 0%, #6B303A 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Crimson Text', serif;
      font-size: 36px;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 12px rgba(139, 64, 73, 0.3);
    }
    
    .company-info h1 {
      font-family: 'Crimson Text', serif;
      font-size: 36px;
      font-weight: 700;
      color: #8B4049;
      margin-bottom: 5px;
    }
    
    .company-tagline {
      font-size: 15px;
      font-style: italic;
      color: #888;
      font-weight: 300;
    }
    
    .invoice-title-section {
      text-align: right;
    }
    
    .invoice-title {
      font-family: 'Crimson Text', serif;
      font-size: 48px;
      font-weight: 700;
      color: #8B4049;
      margin-bottom: 10px;
    }
    
    .invoice-number {
      font-size: 18px;
      color: #D4AF37;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .invoice-dates {
      font-size: 14px;
      color: #888;
    }
    
    .invoice-dates p {
      margin: 3px 0;
    }
    
    .invoice-body {
      padding: 50px 60px;
    }
    
    .two-column-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 2px solid #8B4049;
    }
    
    .section-title {
      font-family: 'Crimson Text', serif;
      font-size: 14px;
      font-weight: 700;
      color: #8B4049;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    
    .detail-label {
      font-weight: 600;
      min-width: 100px;
      color: #666;
    }
    
    .detail-value {
      color: #333;
      font-weight: 400;
    }
    
    .venue-section-title {
      font-family: 'Crimson Text', serif;
      font-size: 14px;
      font-weight: 700;
      color: #8B4049;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 25px;
    }
    
    .venue-card {
      background: linear-gradient(135deg, #FEF5E7 0%, #FAF0E6 100%);
      border: 2px solid #D4AF37;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 40px;
    }
    
    .venue-name {
      font-family: 'Crimson Text', serif;
      font-size: 28px;
      font-weight: 700;
      color: #8B4049;
      margin-bottom: 20px;
    }
    
    .venue-details {
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .venue-detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      color: #666;
    }
    
    .venue-icon {
      font-size: 18px;
    }
    
    .billing-title {
      font-family: 'Crimson Text', serif;
      font-size: 14px;
      font-weight: 700;
      color: #8B4049;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 25px;
    }
    
    .billing-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .billing-table thead {
      background: linear-gradient(135deg, #8B4049 0%, #6B303A 100%);
      color: white;
    }
    
    .billing-table th {
      padding: 18px 20px;
      text-align: left;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .billing-table th:last-child,
    .billing-table td:last-child {
      text-align: right;
    }
    
    .billing-table td {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .item-name {
      font-weight: 700;
      color: #333;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .item-description {
      font-size: 13px;
      color: #888;
    }
    
    .totals-section {
      max-width: 450px;
      margin-left: auto;
      margin-top: 30px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
    }
    
    .total-row.subtotal,
    .total-row.tax,
    .total-row.advance {
      color: #666;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .total-row.advance .total-value {
      color: #22c55e;
      font-weight: 700;
    }
    
    .total-row.final {
      font-family: 'Crimson Text', serif;
      font-size: 24px;
      font-weight: 700;
      color: #8B4049;
      padding-top: 20px;
      border-top: 3px solid #8B4049;
      margin-top: 10px;
    }
    
    .payment-status-section {
      text-align: center;
      margin: 50px 0;
    }
    
    .payment-status-title {
      font-family: 'Crimson Text', serif;
      font-size: 14px;
      font-weight: 700;
      color: #8B4049;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    
    .payment-badge {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      margin-bottom: 15px;
    }
    
    .payment-badge::before {
      content: '✓ ';
      font-size: 18px;
    }
    
    .payment-date {
      font-size: 14px;
      color: #888;
      margin-top: 10px;
    }
    
    .confirmation-box {
      text-align: center;
      margin: 40px auto;
      max-width: 400px;
    }
    
    .confirmation-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    
    .confirmation-number {
      font-family: 'Crimson Text', serif;
      font-size: 32px;
      font-weight: 700;
      color: #8B4049;
      padding: 20px;
      border: 3px dashed #D4AF37;
      border-radius: 8px;
      background: #FFFEF8;
    }
    
    .invoice-footer {
      background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
      border-top: 3px solid #8B4049;
      padding: 50px 60px;
      text-align: center;
    }
    
    .footer-thank-you {
      font-family: 'Crimson Text', serif;
      font-size: 28px;
      font-weight: 700;
      color: #8B4049;
      margin-bottom: 25px;
    }
    
    .footer-contact {
      margin: 20px 0;
    }
    
    .footer-contact p {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 8px 0;
      font-size: 14px;
      color: #666;
    }
    
    .footer-disclaimer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #888;
      font-style: italic;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-section">
        <div class="company-logo">G</div>
        <div class="company-info">
          <h1>Grand Occasion</h1>
          <div class="company-tagline">Where Elegance Meets Excellence</div>
        </div>
      </div>
      
      <div class="invoice-title-section">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#${booking.confirmation_number || booking.id.slice(0, 8).toUpperCase()}</div>
        <div class="invoice-dates">
          <p>Date: ${format(new Date(), 'MMMM dd, yyyy')}</p>
          <p>Event Date: ${format(new Date(booking.booking_date), 'MMMM dd, yyyy')}</p>
        </div>
      </div>
    </div>
    
    <!-- Body -->
    <div class="invoice-body">
      <!-- Two Column Section -->
      <div class="two-column-section">
        <div>
          <div class="section-title">Bill To</div>
          <div class="detail-row">
            <div class="detail-label">Name:</div>
            <div class="detail-value">${customerName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${customerEmail}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Phone:</div>
            <div class="detail-value">N/A</div>
          </div>
        </div>
        
        <div>
          <div class="section-title">Event Details</div>
          <div class="detail-row">
            <div class="detail-label">Event Type:</div>
            <div class="detail-value">${booking.event_type || 'Special Event'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${format(new Date(booking.booking_date), 'EEEE, MMMM dd, yyyy')}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time:</div>
            <div class="detail-value">${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Guests:</div>
            <div class="detail-value">${booking.guest_count || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <!-- Venue Section -->
      <div class="venue-section-title">Venue(s) Booked</div>
      <div class="venue-card">
        <div class="venue-name">${hallNames}</div>
        <div class="venue-details">
          <div class="venue-detail-item">
            <span class="venue-icon">📍</span>
            <span>Capacity: ${halls[0]?.capacity || 100} guests</span>
          </div>
          <div class="venue-detail-item">
            <span class="venue-icon">💰</span>
            <span>₹${pricePerHour.toLocaleString()}/hour</span>
          </div>
          <div class="venue-detail-item">
            <span class="venue-icon">✨</span>
            <span>${amenities}</span>
          </div>
        </div>
      </div>
      
      <!-- Billing Summary -->
      <div class="billing-title">Billing Summary</div>
      <table class="billing-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-name">${hallNames}</div>
              <div class="item-description">Venue rental for ${booking.event_type || 'Event'}</div>
            </td>
            <td>${totalHours.toFixed(1)}</td>
            <td>₹${pricePerHour.toLocaleString()}/hr</td>
            <td>₹${subtotal.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Totals -->
      <div class="totals-section">
        <div class="total-row subtotal">
          <span>Subtotal</span>
          <span class="total-value">₹${subtotal.toLocaleString()}</span>
        </div>
        <div class="total-row tax">
          <span>Tax (0%)</span>
          <span class="total-value">₹0</span>
        </div>
        <div class="total-row advance">
          <span>Advance Paid</span>
          <span class="total-value">₹${advancePaid.toLocaleString()}</span>
        </div>
        <div class="total-row final">
          <span>Total Amount</span>
          <span class="total-value">₹${total.toLocaleString()}</span>
        </div>
      </div>
      
      <!-- Payment Status -->
      <div class="payment-status-section">
        <div class="payment-status-title">Payment Status</div>
        <div class="payment-badge">Paid In Full</div>
        <div class="payment-date">
          Payment received on ${format(new Date(booking.payment_date || new Date()), 'MMMM dd, yyyy \'at\' hh:mm a')}
        </div>
      </div>
      
      <!-- Confirmation Number -->
      <div class="confirmation-box">
        <div class="confirmation-label">Confirmation Number</div>
        <div class="confirmation-number">${booking.confirmation_number || booking.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-thank-you">Thank you for choosing Grand Occasion!</div>
      
      <div class="footer-contact">
        <p>📍 Grand Occasion, Premium Events District, City Center</p>
        <p>📞 +91 98765 43210 | ✉️ info@grandoccasion.com</p>
        <p>🌐 www.grandoccasion.com</p>
      </div>
      
      <div class="footer-disclaimer">
        This is a computer-generated invoice and does not require a signature.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Convert HTML to PDF and download
  const element = document.createElement('div');
  element.innerHTML = invoiceHTML;
  
  const opt = {
    margin: 0,
    filename: `Invoice_${booking.confirmation_number || booking.id.slice(0, 8)}_GrandOccasion.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};

function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return Math.round((endMinutes - startMinutes) / 60 * 10) / 10;
}

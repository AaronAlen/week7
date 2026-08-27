import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.resolve(__dirname, '../../sample_vendor_pdfs');
const clientDir = path.resolve(__dirname, '../../../client/public/sample_vendor_pdfs');

if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });

// 10 Genuinely Distinct Document Types, Contacts & Structures
const VENDORS = [
  {
    id: 1,
    filename: 'Vendor_01_Apex_Engineering_SLA.pdf',
    vendorName: 'Apex Component Dynamics Ltd.',
    vendorEmail: 'sales@apexcomponents.co.uk',
    vendorPhone: '+44 20 7946 0912',
    docType: 'MASTER SERVICE AGREEMENT & WARRANTY SLA',
    docRef: 'MSA-EU-2026-APX',
    headerColor: [0.08, 0.16, 0.32],
    layout: 'CONTRACT_CLAUSES',
    unitPrice: 42.50,
    moq: 100,
    warrantyMonths: 24,
    leadTimeDays: 10,
    qualityGrade: 'ISO 9001:2015 Grade A+',
    defectRate: '0.40%',
    paymentTerms: 'Net 30 Days Commercial Credit',
    productName: 'APX-4K90 Industrial Display Unit (4K UHD)',
    summary: 'Comprehensive formal European SLA with guaranteed 48-hour free transit damage replacements and 2-year warranty.',
    bodyText: [
      'SECTION 1: SCOPE OF SUPPLY & CONTACT DETAILS',
      'Apex Component Dynamics Ltd. | Email: sales@apexcomponents.co.uk | Tel: +44 20 7946 0912 | Address: 14 Canary Wharf, London, UK. Agrees to supply Model APX-4K90 4K UHD Industrial Display Modules at $42.50 USD (FOB London). Minimum batch order quantity: 100 units.',
      'SECTION 2: WARRANTY INDEMNITY & DEFECT PROTOCOL',
      'Supplier guarantees that all modules remain free from optical, electrical, and mechanical defects for twenty-four (24) months. In the event of batch failure exceeding 0.40%, Supplier dispatches replacement inventory via priority air courier within 48 hours at zero cost to Buyer.',
      'SECTION 3: COMMERCIAL PAYMENT TERMS',
      'Invoices payable strictly Net 30 days from bill of lading date. Quality certified under ISO 9001:2015 standards.'
    ]
  },
  {
    id: 2,
    filename: 'Vendor_02_Shenzhen_Proforma_Invoice.pdf',
    vendorName: 'Shenzhen HyperTech Displays Co., Ltd.',
    vendorEmail: 'export@hypertech-display.cn',
    vendorPhone: '+86 755 8321 4400',
    docType: 'COMMERCIAL PRO-FORMA INVOICE & EXPORT QUOTATION',
    docRef: 'PI-SZ-2026-8891',
    headerColor: [0.72, 0.12, 0.12],
    layout: 'INVOICE_TABLE',
    unitPrice: 34.00,
    moq: 200,
    warrantyMonths: 12,
    leadTimeDays: 12,
    qualityGrade: 'Grade A Consumer Spec (RoHS / CE)',
    defectRate: '1.20%',
    paymentTerms: '30% T/T Deposit, 70% Balance on B/L',
    productName: 'SHT-IPS400 Ultra-Bright IPS Display Panel',
    summary: 'Direct factory export quotation with competitive pricing, 200-unit MOQ, and standard 12-month factory defect coverage.',
    bodyText: [
      'FACTORY EXPORT COMMERCIAL CONTACT & TERMS:',
      '• Direct Factory Account Manager: export@hypertech-display.cn | WhatsApp/Tel: +86 755 8321 4400 | Shenzhen High-Tech Park, Nanshan, China.',
      '1. ITEM DESCRIPTION: SHT-IPS400 IPS 4K Panel, 450 Nits Brightness, 1000:1 Contrast Ratio.',
      '2. UNIT FOB PRICE: $34.00 USD / piece (Port of Shenzhen, China). Minimum order: 200 pcs.',
      '3. FACTORY WARRANTY: 12 Months Standard Coverage against dead pixels and back-light failure.',
      '4. DEFECT REPLACEMENT: Defect threshold set at 1.20%. Defective components credited on subsequent order.',
      '5. LEAD TIME: Production completed in 12 business days following receipt of 30% wire deposit.'
    ]
  },
  {
    id: 3,
    filename: 'Vendor_03_Nordic_Aerospace_SpecSheet.pdf',
    vendorName: 'Nordic Precision Micro Corp (Stockholm)',
    vendorEmail: 'contracts@nordicprecision.se',
    vendorPhone: '+46 8 123 4567',
    docType: 'AEROSPACE-GRADE TECHNICAL SPECIFICATION & COMPLIANCE DEED',
    docRef: 'AERO-SPEC-NPM-992',
    headerColor: [0.05, 0.35, 0.45],
    layout: 'TECH_DATASHEET',
    unitPrice: 54.00,
    moq: 50,
    warrantyMonths: 36,
    leadTimeDays: 7,
    qualityGrade: 'Aerospace Grade A++ (Class 100 Cleanroom)',
    defectRate: '0.08%',
    paymentTerms: 'Net 60 Days',
    productName: 'NPM-AERO4K Military & Aviation Grade Display Subsystem',
    summary: 'Ultra-low defect rate (0.08%), MTBF 150,000 hours, 3-year unconditional replacement warranty with Net 60 days.',
    bodyText: [
      'TECHNICAL SPECIFICATION & ENDURANCE PARAMETERS:',
      '• Technical Liaison: contracts@nordicprecision.se | Tel: +46 8 123 4567 | Kista Science City, Stockholm, Sweden.',
      '• Operational MTBF: 150,000 continuous hours. Operating Temp: -40°C to +85°C.',
      '• Optical Luminance: 1200 Nits Sunlight-Readable with zero pixel degradation guarantee.',
      '• Unconditional 36-Month (3 Year) Full Replacement Warranty covering all hardware faults.',
      '• Verified Cleanroom ISO Class 5 manufacturing with measured defect rate < 0.08%.',
      '• Express 7-Day Air Delivery via SAS Scandinavian Cargo. Payment terms: Net 60 Days.'
    ]
  },
  {
    id: 4,
    filename: 'Vendor_04_Global_Wholesale_RateCard.pdf',
    vendorName: 'Global Sourcing & Logistics Inc. (Dallas, TX)',
    vendorEmail: 'quotes@globalsourcing.com',
    vendorPhone: '+1 214 555 0199',
    docType: 'B2B VOLUME WHOLESALE RATE CARD & CLEARANCE QUOTE',
    docRef: 'GSL-VOL-2026-Q3',
    headerColor: [0.25, 0.25, 0.25],
    layout: 'RATE_CARD',
    unitPrice: 31.50,
    moq: 250,
    warrantyMonths: 6,
    leadTimeDays: 28,
    qualityGrade: 'Commercial Standard Grade C',
    defectRate: '2.80%',
    paymentTerms: '50% Upfront Wire, 50% upon Cargo Arrival',
    productName: 'GSL-STD4K Economy TFT Display Matrix',
    summary: 'Lowest unit price of $31.50 for high-volume orders. 6-month limited warranty with customer-funded RMA freight.',
    bodyText: [
      'SALES DESK CONTACT & VOLUME SCHEDULE:',
      '• Wholesale Sourcing Desk: quotes@globalsourcing.com | Phone: +1 214 555 0199 | Dallas, TX, USA.',
      '• Tier 1 (250 - 499 units): $31.50 USD / unit (Selected MOQ)',
      '• Tier 2 (500 - 999 units): $29.50 USD / unit | Tier 3 (1000+ units): $27.80 USD / unit',
      'COMMERCIAL CONDITIONS & RMA DISCLAIMER:',
      'Warranty is strictly limited to 6 months from purchase date. Defect tolerance is capped at 2.80%. Buyer is responsible for return shipping freight on all replacement claims. Delivery via standard ocean freight in 28 days.'
    ]
  },
  {
    id: 5,
    filename: 'Vendor_05_Vanguard_US_Military_Cert.pdf',
    vendorName: 'Vanguard Electronics USA (Phoenix, AZ)',
    vendorEmail: 'defense-rfp@vanguard-usa.com',
    vendorPhone: '+1 602 555 0144',
    docType: 'DOMESTIC DEFENSE CONTRACTOR QUOTE & MIL-SPEC CERTIFICATE',
    docRef: 'DOD-CAGE-7X89-VE',
    headerColor: [0.15, 0.28, 0.15],
    layout: 'MIL_CERT',
    unitPrice: 48.00,
    moq: 50,
    warrantyMonths: 18,
    leadTimeDays: 3,
    qualityGrade: 'Military Spec MIL-STD-810G Ruggedized',
    defectRate: '0.20%',
    paymentTerms: 'Net 45 Days',
    productName: 'VE-RUG-900 Shockproof Tactical Industrial Screen',
    summary: 'Domestic US fulfillment with 72-hour delivery, MIL-STD shock resistance, and dedicated US account support.',
    bodyText: [
      'UNITED STATES DOMESTIC SOURCING COMPLIANCE & CONTACT:',
      '• Program Officer: defense-rfp@vanguard-usa.com | Secure Line: +1 602 555 0144 | Phoenix, Arizona, USA.',
      '• CAGE Code: 7X892 | ITAR Compliant | Assembled in Phoenix, Arizona, USA.',
      '• Tested under MIL-STD-810G for vibration, shock, humidity, and drop resistance.',
      '• Delivery Fulfillment: 3 Business Days via FedEx Priority Express domestic freight.',
      '• 18-Month Hardware Warranty with 24-hour advance component swap program. Net 45 Days.'
    ]
  },
  {
    id: 6,
    filename: 'Vendor_06_Bavaria_TUV_Warranty_Deed.pdf',
    vendorName: 'Bavaria Quantum Components GmbH (Munich)',
    vendorEmail: 'vertrieb@bavaria-quantum.de',
    vendorPhone: '+49 89 2441 5500',
    docType: 'TUV RHEINLAND CERTIFICATE & 5-YEAR EXTENDED WARRANTY DEED',
    docRef: 'DE-TUV-2026-BQC-05',
    headerColor: [0.45, 0.15, 0.55],
    layout: 'WARRANTY_DEED',
    unitPrice: 59.50,
    moq: 100,
    warrantyMonths: 60,
    leadTimeDays: 14,
    qualityGrade: 'German TUV Certified Grade A+++ (DIN EN ISO 9001)',
    defectRate: '0.05%',
    paymentTerms: 'Net 60 Days Bank Transfer',
    productName: 'BQC-LL500 Ultra-Long-Life Industrial Display Subsystem',
    summary: 'Market-leading 5-Year (60 Month) warranty with near-zero 0.05% defect rate and rigorous German TUV certification.',
    bodyText: [
      'GERMAN QUALITY ACCREDITATION & CONTACT:',
      '• Head of Institutional Accounts: vertrieb@bavaria-quantum.de | Tel: +49 89 2441 5500 | Max-Planck-Ring, Munich, Germany.',
      '• Formal 60-Month (5 Full Years) Warranty Deed backed by Munich Re-Insurance underwriting.',
      '• Certified under DIN EN ISO/IEC 17025 calibration standards with batch defect rate < 0.05%.',
      '• Guaranteed availability of spare parts and components for ten (10) continuous calendar years.',
      '• Price: $59.50 USD per unit. Payment terms: Net 60 days via SWIFT bank transfer. 14 business days lead.'
    ]
  },
  {
    id: 7,
    filename: 'Vendor_07_Pacific_Taiwan_Clearance.pdf',
    vendorName: 'Pacific Rim Micro-Optics (Hsinchu, Taiwan)',
    vendorEmail: 'sales@pacificrim-optics.tw',
    vendorPhone: '+886 3 571 2121',
    docType: 'SPOT-MARKET DIRECT COMPONENT QUOTATION',
    docRef: 'TW-SPOT-2026-PRM',
    headerColor: [0.55, 0.35, 0.05],
    layout: 'SPOT_CLEARANCE',
    unitPrice: 29.90,
    moq: 500,
    warrantyMonths: 3,
    leadTimeDays: 35,
    qualityGrade: 'Economy Commercial Grade D',
    defectRate: '3.50%',
    paymentTerms: '100% Upfront Wire Transfer',
    productName: 'PRM-ECO-100 High-Volume Economy Display Panel',
    summary: 'Ultra-low cost wholesale clearance panel ($29.90), requiring 500 units MOQ, ocean freight, and 90-day limited warranty.',
    bodyText: [
      'SPOT MARKET SPECIAL LOT TERMS & CONTACT:',
      '• Asia Trading Desk: sales@pacificrim-optics.tw | Tel: +886 3 571 2121 | Hsinchu Science Park, Taiwan.',
      '• Rock-bottom pricing of $29.90 USD per unit for volume procurement batches.',
      '• Mandatory Minimum Order Quantity (MOQ): 500 units. Full payment required prior to container loading.',
      '• Limited 90-Day (3 Month) component warranty covering DOA (Dead On Arrival) items only.',
      '• Factory batch defect rate estimate: 3.50%. Delivery lead time: 35 business days via ocean freight.'
    ]
  },
  {
    id: 8,
    filename: 'Vendor_08_Kyoto_Photonics_Charter.pdf',
    vendorName: 'Kyoto Precision Photonics K.K. (Kyoto, Japan)',
    vendorEmail: 'global-orders@kyoto-photonics.co.jp',
    vendorPhone: '+81 75 342 9901',
    docType: 'JAPAN QUALITY ASSURANCE (JQA) MASTER QUOTATION',
    docRef: 'JP-JQA-2026-KPP',
    headerColor: [0.65, 0.05, 0.25],
    layout: 'JAPANESE_CHARTER',
    unitPrice: 52.00,
    moq: 75,
    warrantyMonths: 24,
    leadTimeDays: 8,
    qualityGrade: 'Japanese JQA Certified Grade A+ (Zero Dead Pixel SLA)',
    defectRate: '0.09%',
    paymentTerms: 'Net 30 Days (Letter of Credit)',
    productName: 'KPP-OPTIC4K High-Dynamic-Range Optical Display Module',
    summary: 'Optical grade precision displays with zero-dead-pixel guarantee, 2-year warranty, and express 8-day delivery.',
    bodyText: [
      'KYOTO PRECISION PHOTONICS QUALITY CHARTER & CONTACT:',
      '• Global Operations Representative: global-orders@kyoto-photonics.co.jp | Tel: +81 75 342 9901 | Shimogyo-ku, Kyoto, Japan.',
      '• Zero Dead Pixel Guarantee (100% individual optical sensor inspection prior to packaging).',
      '• Extreme Optical Purity: 99.8% DCI-P3 color gamut coverage with anti-reflective sapphire coating.',
      '• 24-Month Full Hardware Replacement Warranty with Japanese domestic engineer liaison.',
      '• Lead Time: 8 business days via ANA / JAL Express Air Cargo. Price: $52.00 USD. Net 30 Days LC.'
    ]
  },
  {
    id: 9,
    filename: 'Vendor_09_Solaria_Green_RoHS_Proposal.pdf',
    vendorName: 'Solaria Core Technologies Inc. (San Jose, CA)',
    vendorEmail: 'clean-energy@solaria-core.com',
    vendorPhone: '+1 408 555 0188',
    docType: 'ROHS & WEEE GREEN ENVIRONMENTAL SUPPLY PROPOSAL',
    docRef: 'US-SOL-GREEN-2026',
    headerColor: [0.08, 0.45, 0.25],
    layout: 'GREEN_PROPOSAL',
    unitPrice: 44.00,
    moq: 100,
    warrantyMonths: 24,
    leadTimeDays: 6,
    qualityGrade: 'RoHS / CE / Energy Star Tier 4 Grade A',
    defectRate: '0.50%',
    paymentTerms: 'Net 30 Days',
    productName: 'SOL-GREEN-4K Eco-Efficient Low-Power Display Panel',
    summary: 'Energy-saving 4K panels with 6-day lead times, 24-month eco-repair warranty, and complete RoHS environmental compliance.',
    bodyText: [
      'SUSTAINABLE MANUFACTURING & CONTACT:',
      '• Environmental Accounts Director: clean-energy@solaria-core.com | Phone: +1 408 555 0188 | Silicon Valley, San Jose, CA, USA.',
      '• 40% Lower Power Consumption than standard industrial panels (Energy Star Tier 4 Certified).',
      '• 100% Recyclable aluminum chassis with zero hazardous halogen / lead soldering (RoHS Compliant).',
      '• 24-Month Eco-Repair & Replacement Warranty with local US circular-economy service hubs.',
      '• Rapid 6-Day Delivery turnaround. Price: $44.00 USD / unit (MOQ: 100 units). Net 30 Days.'
    ]
  },
  {
    id: 10,
    filename: 'Vendor_10_Atlas_Commercial_Agreement.pdf',
    vendorName: 'Atlas Industrial Supply Co. (Cleveland, OH)',
    vendorEmail: 'contracts@atlas-industrialsupply.com',
    vendorPhone: '+1 216 555 0177',
    docType: 'COMMERCIAL SUPPLY AGREEMENT & 2/10 NET 30 TERMS',
    docRef: 'US-AIS-COMM-2026-Q3',
    headerColor: [0.2, 0.3, 0.45],
    layout: 'COMMERCIAL_DISCOUNT',
    unitPrice: 38.50,
    moq: 150,
    warrantyMonths: 12,
    leadTimeDays: 18,
    qualityGrade: 'Commercial Grade B+ (ANSI Tested)',
    defectRate: '1.50%',
    paymentTerms: '2% 10, Net 30 (2% Early Settlement Cash Discount)',
    productName: 'AIS-COMM-800 Heavy-Duty Commercial Display Module',
    summary: 'Dependable mid-tier volume supplier offering a 2% cash discount for early 10-day settlement and 1-year standard warranty.',
    bodyText: [
      'COMMERCIAL SUPPLY TERMS & CONTACT:',
      '• Regional Commercial Sales Desk: contracts@atlas-industrialsupply.com | Tel: +1 216 555 0177 | Cleveland, Ohio, USA.',
      '• Unit Price: $38.50 USD / unit for MOQ of 150 pieces.',
      '• Payment Incentive: 2% cash discount if invoice is settled within 10 days; otherwise Net 30 days.',
      '• Standard 12-Month (1 Year) Limited Warranty covering manufacturing defects.',
      '• Defect Tolerance: 1.50% threshold with credit memo adjustments. Delivery: 18 business days.'
    ]
  }
];

async function createDiversePdf(vendor) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const { width, height } = page.getSize();
  const [r, g, b] = vendor.headerColor;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 105,
    width,
    height: 105,
    color: rgb(r, g, b)
  });

  page.drawText(vendor.docType, {
    x: 35,
    y: height - 38,
    size: 12.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText(`REF: ${vendor.docRef} | EMAIL: ${vendor.vendorEmail} | TEL: ${vendor.vendorPhone}`, {
    x: 35,
    y: height - 60,
    size: 8.5,
    font: fontMono,
    color: rgb(0.85, 0.92, 1.0)
  });

  page.drawText(`ISSUING ENTITY: ${vendor.vendorName.toUpperCase()}`, {
    x: 35,
    y: height - 80,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  let y = height - 135;

  // Overview Card
  page.drawRectangle({
    x: 30,
    y: y - 55,
    width: width - 60,
    height: 65,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(r, g, b),
    borderWidth: 1.5
  });

  page.drawText(`PRODUCT OFFERING: ${vendor.productName}`, {
    x: 42,
    y: y - 10,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25)
  });

  page.drawText(`OFFICIAL VENDOR CONTACT: ${vendor.vendorEmail} | Phone: ${vendor.vendorPhone}`, {
    x: 42,
    y: y - 28,
    size: 9,
    font: fontBold,
    color: rgb(r, g, b)
  });

  page.drawText(`STRATEGIC PROFILE: ${vendor.summary}`, {
    x: 42,
    y: y - 46,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
    maxWidth: width - 85,
    lineHeight: 11
  });

  y -= 85;

  // Commercial Parameters Table
  page.drawText('OFFICIAL COMMERCIAL & WARRANTY SPECIFICATIONS', {
    x: 35,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25)
  });

  y -= 14;

  const tableData = [
    ['Vendor Official Email', `${vendor.vendorEmail}`],
    ['Vendor Direct Phone / WhatsApp', `${vendor.vendorPhone}`],
    ['Unit Quote (FOB)', `$${vendor.unitPrice.toFixed(2)} USD per unit`],
    ['Minimum Order Quantity (MOQ)', `${vendor.moq} units`],
    ['Standard Warranty Period', `${vendor.warrantyMonths} Months (${(vendor.warrantyMonths / 12).toFixed(1)} Years)`],
    ['Delivery & Fulfillment Lead Time', `${vendor.leadTimeDays} Business Days`],
    ['Quality Grade & Certification', `${vendor.qualityGrade}`],
    ['Batch Defect Rate Tolerance', `${vendor.defectRate}`],
    ['Agreed Commercial Payment Terms', `${vendor.paymentTerms}`]
  ];

  tableData.forEach(([label, val], idx) => {
    const rowY = y - (idx * 22);
    page.drawRectangle({
      x: 30,
      y: rowY - 16,
      width: width - 60,
      height: 21,
      color: idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(0.93, 0.95, 0.98)
    });

    page.drawText(label, {
      x: 40,
      y: rowY - 9,
      size: 8.5,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3)
    });

    page.drawText(val, {
      x: 240,
      y: rowY - 9,
      size: 8.5,
      font: fontMono,
      color: idx < 2 ? rgb(0.1, 0.1, 0.1) : rgb(r, g, b)
    });
  });

  y -= (tableData.length * 22) + 26;

  // Detailed Terms & Structure
  page.drawText('CONTRACTUAL TERMS, LEGAL WARRANTIES & SLA PROVISIONS', {
    x: 35,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25)
  });

  y -= 16;

  vendor.bodyText.forEach(paragraph => {
    const isHeading = paragraph.startsWith('SECTION') || paragraph.startsWith('FACTORY') || paragraph.startsWith('TECHNICAL') || paragraph.startsWith('VOLUME') || paragraph.startsWith('UNITED') || paragraph.startsWith('GERMAN') || paragraph.startsWith('SPOT') || paragraph.startsWith('KYOTO') || paragraph.startsWith('SUSTAINABLE') || paragraph.startsWith('COMMERCIAL');
    
    page.drawText(paragraph, {
      x: 35,
      y,
      size: isHeading ? 9 : 8,
      font: isHeading ? fontBold : fontRegular,
      color: isHeading ? rgb(0.1, 0.15, 0.25) : rgb(0.25, 0.3, 0.4),
      maxWidth: width - 70,
      lineHeight: 11
    });

    y -= isHeading ? 16 : 24;
  });

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 35,
    color: rgb(0.95, 0.96, 0.98)
  });

  page.drawText(`StockPilot AI Supplier Sourcing RFP Dataset | ${vendor.vendorName} | ${vendor.vendorEmail} | Page 1 of 1`, {
    x: 35,
    y: 12,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65)
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(serverDir, vendor.filename), pdfBytes);
  fs.writeFileSync(path.join(clientDir, vendor.filename), pdfBytes);
  console.log(`✅ Generated: ${vendor.filename} with Email (${vendor.vendorEmail}) & Phone (${vendor.vendorPhone})`);
}

async function run() {
  console.log('Regenerating 10 Distinct Vendor PDFs with full contact details...\n');
  for (const v of VENDORS) {
    await createDiversePdf(v);
  }

  fs.writeFileSync(path.join(clientDir, 'manifest.json'), JSON.stringify(VENDORS, null, 2));
  fs.writeFileSync(path.join(serverDir, 'manifest.json'), JSON.stringify(VENDORS, null, 2));
  console.log('\n🎉 All 10 Distinct Vendor PDF Documents successfully generated with contact details!');
}

run().catch(console.error);

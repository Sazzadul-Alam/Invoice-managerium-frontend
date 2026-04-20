# 80mm Thermal Receipt Print Configuration

This document outlines the precise CSS architecture, styling heuristics, and dimensional variables integrated into `InvoiceTemplate.tsx` to achieve flawless browser-to-hardware printing on generic 80mm thermal ESC/POS receipt hardware.

## 1. Dimensional Constraints & Scaling

### Web Interface Emulation
To properly visualize how lines will fold and wrap before attempting a print, the receipt's wrapper must strictly emulate the physical properties of generic 80mm paper rolls:
```css
/* UI Preview Constrains */
width: 100%;
max-width: 320px; /* Maps closely to 80mm canvas in a desktop interface */
```

### Intelligent Print Scaling (The \`zoom\` Hack)
When you hand off a \`320px\` flexbox to a raw printer driver, heavy data will still occasionally wrap unexpectedly because of the driver's native margins. To protect against this WITHOUT ruining our UI preview, we mathematically shrink the rendered node during the print cycle using CSS \`zoom\`:
```css
@media print {
  .print-scaler {
    zoom: 0.88; /* ~12% overall dimension reduction strictly on paper */
  }
}
```

## 2. Universal @Media Print Overrides

A massive hurdle to browser POS printing is the browser's innate desire to format it like an A4 letter with URLs and page numbers. We strip those constraints and stop the terminal from spitting out blank paper after the receipt.

```css
@media print {
  /* Strips the default browser timestamp, URL, and page number headers */
  @page { 
    margin: 0; 
  }

  /* 
    Destroys the React 100vh app wrappers to ensure the page stops exactly
    where the content ends, telling the thermal cutter to trigger instantly!
  */
  html, body, #root {
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Forces the print driver to accept exact background colors if enabled */
  body { 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact; 
  }
}
```

## 3. Typography & Hierarchy

Thermal dot-matrix printers handle grays terribly (they use dithering algorithms that result in blurry receipts). High legibility is constructed exclusively through weight pairing.

- **Colors**: Strictly pure \`#000000\` black. Avoid any grays (`#333`, `#444`).
- **Font Size**: Standardized baseline at \`11px\`.
- **Headers/Labels**: (e.g. `INVOICE NO.`, `BILLED TO`, `ITEM`) must be locked at `fontWeight: 800`.
- **Content/Values**: (e.g. `14 Apr 2026`, `Customer Name`) strictly separated by using `fontWeight: 500`.

## 4. Maximizing Horizontal Space

Standard web components use \`16px\` to \`24px\` horizontal padding (`px-4`, `px-6`). Generic 80mm thermal spools have absolutely zero room to spare. 
- Container horizontal padding should be decimated down to just `4px` or `8px` at most.
- Any dual-text horizontal blocks (like "Name" mapped to the left, and "Phone" mapped to the right) should be mounted across standard flexboxes `justify-content="space-between"` to keep information tight.

## 5. Header Inverse Mechanics

When viewing the POS dashboard, vibrant brand colors (e.g. the `#005C72` Deep Sea blue) look fantastic. But printers often fail to translate background colors smoothly over thermal coils. 
To preserve the brand in-app but print reliably:

1. **Inline Design**: Keep the standard HTML block colorful.
2. **Reverse Trigger**: Inject `!important` CSS rules targeting the header class only under `@media print` to invert the design to Black Text on a Transparent Background.

```css
@media print {
  .print-header { 
    background: transparent !important; 
    border-bottom: 1px dashed #000 !important; 
  }
  .print-header h3, .print-header p { 
    color: #000000 !important; 
  }
}
```

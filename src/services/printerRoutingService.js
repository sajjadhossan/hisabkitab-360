/**
 * HisabKitab 360 - Multi-Printer Routing Architecture
 * ---------------------------------------------------
 * Tip 10: Intelligent printer router supporting:
 * - Counter 1/2 Receipt Thermal (58mm/80mm)
 * - Warehouse/Kitchen Packing Slip (Slip Printer)
 * - Office/A4 Official Tax Invoice (Laser/Inkjet)
 */

export const PrinterTarget = {
  COUNTER_POS: 'counter_pos',       // ESC/POS Thermal Receipt
  WAREHOUSE_KITCHEN: 'warehouse',   // Order Ticket / Kitchen Chithi
  OFFICE_A4: 'office_a4'            // Full Formal Invoice
};

class PrinterRoutingService {
  constructor() {
    this.configuredPrinters = {
      [PrinterTarget.COUNTER_POS]: { name: 'Thermal 80mm', width: '80mm', autoCut: true },
      [PrinterTarget.WAREHOUSE_KITCHEN]: { name: 'Warehouse Slip', width: '58mm', autoCut: true },
      [PrinterTarget.OFFICE_A4]: { name: 'Standard Office A4', width: 'A4', autoCut: false }
    };
  }

  /**
   * Route and format print job based on target destination
   * @param {string} target - PrinterTarget enum
   * @param {Object} documentData - Invoice or Order data
   */
  dispatchPrintJob(target = PrinterTarget.COUNTER_POS, documentData = {}) {
    const printer = this.configuredPrinters[target];

    console.log(`[PrinterRouter] Dispatching to ${printer.name} (${target}):`, documentData);

    // In browser environment, trigger window.print with scoped CSS media query
    if (typeof window !== 'undefined') {
      window.print();
    }

    return {
      success: true,
      target,
      printerName: printer.name,
      dispatchedAt: new Date().toISOString()
    };
  }

  getPrinterConfig() {
    return { ...this.configuredPrinters };
  }

  updatePrinterConfig(target, config) {
    if (this.configuredPrinters[target]) {
      this.configuredPrinters[target] = { ...this.configuredPrinters[target], ...config };
    }
  }
}

export const printerRoutingService = new PrinterRoutingService();

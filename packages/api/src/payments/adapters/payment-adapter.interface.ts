// ═══════════════════════════════════════════════════════════════
// PAYMENT ADAPTER INTERFACE
// Every payment provider implements this interface.
// Swapping mock → real = implementing a new class. Nothing else changes.
// ═══════════════════════════════════════════════════════════════

export interface BillInquiryResult {
  success: boolean;
  accountRef: string;       // Account number at provider
  customerName?: string;
  amount?: number;          // If fixed-amount bill (e.g., postpaid electric)
  dueDate?: string;
  additionalInfo?: Record<string, any>;
}

export interface BillPayResult {
  success: boolean;
  providerRef: string;      // Provider's transaction ID
  amount: number;
  message: string;
  receiptData?: Record<string, any>;
}

export interface PaymentAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly category: string;
  readonly logoUrl: string;
  readonly requiresInquiry: boolean;  // Some providers need a pre-inquiry step
  readonly fixedAmount: boolean;      // true = user can't choose amount

  // Fetch bill details before payment
  inquire(accountRef: string, params?: Record<string, string>): Promise<BillInquiryResult>;

  // Execute the payment
  pay(accountRef: string, amount: number, meta?: Record<string, string>): Promise<BillPayResult>;
}

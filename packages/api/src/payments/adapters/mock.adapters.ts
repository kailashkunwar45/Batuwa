import { PaymentAdapter, BillInquiryResult, BillPayResult } from './payment-adapter.interface';

// ═══════════════════════════════════════════════════════════════
// MOCK ADAPTERS — Simulates all Nepal payment providers
// Replace each class with a real API adapter when creds are ready
// ═══════════════════════════════════════════════════════════════

function mockDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockProviderRef(): string {
  return `MOCK${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

// ─────────────────────────────────────────────────────────────
// MOBILE TOPUP
// ─────────────────────────────────────────────────────────────

export class NcellTopupAdapter implements PaymentAdapter {
  readonly providerId = 'NCELL_TOPUP';
  readonly providerName = 'Ncell Top-up';
  readonly category = 'MOBILE_TOPUP';
  readonly logoUrl = '/logos/ncell.png';
  readonly requiresInquiry = false;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay();
    return { success: true, accountRef, customerName: 'Ncell Subscriber', additionalInfo: { network: 'Ncell', type: 'Prepaid' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    if (amount < 10 || amount > 5000) return { success: false, providerRef: '', amount, message: 'Amount must be Rs.10–5000' };
    return { success: true, providerRef: mockProviderRef(), amount, message: `Rs.${amount} topped up to ${accountRef} (Ncell)`, receiptData: { network: 'Ncell', phone: accountRef } };
  }
}

export class NtcTopupAdapter implements PaymentAdapter {
  readonly providerId = 'NTC_TOPUP';
  readonly providerName = 'Nepal Telecom Top-up';
  readonly category = 'MOBILE_TOPUP';
  readonly logoUrl = '/logos/ntc.png';
  readonly requiresInquiry = false;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay();
    return { success: true, accountRef, customerName: 'NTC Subscriber', additionalInfo: { network: 'NTC', type: 'Prepaid' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `Rs.${amount} topped up to ${accountRef} (NTC)` };
  }
}

export class SmartCellAdapter implements PaymentAdapter {
  readonly providerId = 'SMARTCELL_TOPUP';
  readonly providerName = 'Smart Cell Top-up';
  readonly category = 'MOBILE_TOPUP';
  readonly logoUrl = '/logos/smartcell.png';
  readonly requiresInquiry = false;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay();
    return { success: true, accountRef, customerName: 'Smart Cell Subscriber' };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `Rs.${amount} topped up to ${accountRef} (Smart Cell)` };
  }
}

// ─────────────────────────────────────────────────────────────
// ELECTRICITY
// ─────────────────────────────────────────────────────────────

export class NeaPrepaidAdapter implements PaymentAdapter {
  readonly providerId = 'NEA_PREPAID';
  readonly providerName = 'NEA Prepaid Meter';
  readonly category = 'ELECTRICITY';
  readonly logoUrl = '/logos/nea.png';
  readonly requiresInquiry = false;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay();
    return { success: true, accountRef, customerName: 'NEA Customer', additionalInfo: { meterNo: accountRef, type: 'Prepaid' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(600);
    const units = (amount / 12.5).toFixed(2); // ~Rs.12.50 per unit (mock rate)
    return {
      success: true,
      providerRef: mockProviderRef(),
      amount,
      message: `Rs.${amount} recharged. ~${units} units added to meter ${accountRef}`,
      receiptData: { meter: accountRef, units, amount },
    };
  }
}

export class NeaPostpaidAdapter implements PaymentAdapter {
  readonly providerId = 'NEA_POSTPAID';
  readonly providerName = 'NEA Postpaid Bill';
  readonly category = 'ELECTRICITY';
  readonly logoUrl = '/logos/nea.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(400);
    const mockAmount = Math.floor(Math.random() * 3000) + 500;
    return {
      success: true,
      accountRef,
      customerName: 'Ram Bahadur Thapa',
      amount: mockAmount,
      dueDate: '2026-04-30',
      additionalInfo: { customerId: accountRef, units: '245', month: 'Chaitra 2082' },
    };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(600);
    return { success: true, providerRef: mockProviderRef(), amount, message: `NEA bill Rs.${amount} paid for customer ${accountRef}` };
  }
}

// ─────────────────────────────────────────────────────────────
// INTERNET PROVIDERS
// ─────────────────────────────────────────────────────────────

abstract class InternetAdapter implements PaymentAdapter {
  abstract readonly providerId: string;
  abstract readonly providerName: string;
  abstract readonly logoUrl: string;
  readonly category = 'INTERNET';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(300);
    const plans = [999, 1499, 1999, 2499];
    const amount = plans[Math.floor(Math.random() * plans.length)];
    return {
      success: true,
      accountRef,
      customerName: 'Internet Customer',
      amount,
      dueDate: '2026-05-01',
      additionalInfo: { username: accountRef, plan: `${amount / 100}Mbps Package`, provider: this.providerName },
    };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `${this.providerName} bill Rs.${amount} paid for ${accountRef}` };
  }
}

export class WorldlinkAdapter extends InternetAdapter {
  readonly providerId = 'INTERNET_WORLDLINK';
  readonly providerName = 'Worldlink Internet';
  readonly logoUrl = '/logos/worldlink.png';
}

export class VianetAdapter extends InternetAdapter {
  readonly providerId = 'INTERNET_VIANET';
  readonly providerName = 'Vianet Internet';
  readonly logoUrl = '/logos/vianet.png';
}

export class SubisuAdapter extends InternetAdapter {
  readonly providerId = 'INTERNET_SUBISU';
  readonly providerName = 'Subisu Internet';
  readonly logoUrl = '/logos/subisu.png';
}

export class ClassicTechAdapter extends InternetAdapter {
  readonly providerId = 'INTERNET_CLASSIC_TECH';
  readonly providerName = 'Classic Tech Internet';
  readonly logoUrl = '/logos/classic.png';
}

// ─────────────────────────────────────────────────────────────
// TV / CABLE
// ─────────────────────────────────────────────────────────────

export class DishHomeTVAdapter implements PaymentAdapter {
  readonly providerId = 'TV_DISHHOME';
  readonly providerName = 'DishHome TV';
  readonly category = 'TV';
  readonly logoUrl = '/logos/dishhome.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(300);
    return { success: true, accountRef, customerName: 'DishHome Subscriber', amount: 500, dueDate: '2026-05-01', additionalInfo: { smartCardNo: accountRef, package: 'Super Pack' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `DishHome TV Rs.${amount} paid for ${accountRef}` };
  }
}

export class NetTVAdapter implements PaymentAdapter {
  readonly providerId = 'TV_NETTV';
  readonly providerName = 'NET TV';
  readonly category = 'TV';
  readonly logoUrl = '/logos/nettv.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(300);
    return { success: true, accountRef, customerName: 'NET TV Subscriber', amount: 350, dueDate: '2026-05-01' };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `NET TV Rs.${amount} paid` };
  }
}

// ─────────────────────────────────────────────────────────────
// WATER
// ─────────────────────────────────────────────────────────────

export class WaterMunicipalAdapter implements PaymentAdapter {
  readonly providerId = 'WATER_MUNICIPAL';
  readonly providerName = 'Municipal Water';
  readonly category = 'WATER';
  readonly logoUrl = '/logos/water.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(400);
    const amount = Math.floor(Math.random() * 800) + 200;
    return { success: true, accountRef, customerName: 'Consumer', amount, dueDate: '2026-04-25', additionalInfo: { consumerId: accountRef, units: Math.floor(amount / 30) } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `Water bill Rs.${amount} paid for ${accountRef}` };
  }
}

// ─────────────────────────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────────────────────────

abstract class EducationAdapter implements PaymentAdapter {
  abstract readonly providerId: string;
  abstract readonly providerName: string;
  abstract readonly logoUrl: string;
  readonly category = 'EDUCATION';
  readonly requiresInquiry = true;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(400);
    return { success: true, accountRef, customerName: 'Student Name', additionalInfo: { rollNo: accountRef, institution: this.providerName } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(600);
    return { success: true, providerRef: mockProviderRef(), amount, message: `${this.providerName} fee Rs.${amount} paid for roll no. ${accountRef}` };
  }
}

export class SchoolFeeAdapter extends EducationAdapter {
  readonly providerId = 'EDU_SCHOOL_FEE';
  readonly providerName = 'School Fee';
  readonly logoUrl = '/logos/school.png';
}
export class CollegeFeeAdapter extends EducationAdapter {
  readonly providerId = 'EDU_COLLEGE_FEE';
  readonly providerName = 'College Fee';
  readonly logoUrl = '/logos/college.png';
}
export class ExamFeeAdapter extends EducationAdapter {
  readonly providerId = 'EDU_EXAM_FEE';
  readonly providerName = 'Exam Registration';
  readonly logoUrl = '/logos/exam.png';
}

// ─────────────────────────────────────────────────────────────
// INSURANCE
// ─────────────────────────────────────────────────────────────

abstract class InsuranceAdapter implements PaymentAdapter {
  abstract readonly providerId: string;
  abstract readonly providerName: string;
  abstract readonly logoUrl: string;
  readonly category = 'INSURANCE';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(400);
    const amount = Math.floor(Math.random() * 5000) + 2000;
    return { success: true, accountRef, customerName: 'Policyholder', amount, dueDate: '2026-06-01', additionalInfo: { policyNo: accountRef, type: this.providerName } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(600);
    return { success: true, providerRef: mockProviderRef(), amount, message: `${this.providerName} premium Rs.${amount} paid` };
  }
}

export class LifeInsuranceAdapter extends InsuranceAdapter {
  readonly providerId = 'INSURANCE_LIFE';
  readonly providerName = 'Life Insurance';
  readonly logoUrl = '/logos/insurance.png';
}
export class HealthInsuranceAdapter extends InsuranceAdapter {
  readonly providerId = 'INSURANCE_HEALTH';
  readonly providerName = 'Health Insurance';
  readonly logoUrl = '/logos/health-ins.png';
}
export class VehicleInsuranceAdapter extends InsuranceAdapter {
  readonly providerId = 'INSURANCE_VEHICLE';
  readonly providerName = 'Vehicle Insurance';
  readonly logoUrl = '/logos/vehicle-ins.png';
}

// ─────────────────────────────────────────────────────────────
// GOVERNMENT
// ─────────────────────────────────────────────────────────────

export class TaxPaymentAdapter implements PaymentAdapter {
  readonly providerId = 'GOV_TAX';
  readonly providerName = 'Tax Payment (IRD)';
  readonly category = 'GOVERNMENT';
  readonly logoUrl = '/logos/ird.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(500);
    return { success: true, accountRef, customerName: 'Taxpayer', amount: Math.floor(Math.random() * 20000) + 5000, additionalInfo: { pan: accountRef, fiscalYear: '2081/82' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(800);
    return { success: true, providerRef: mockProviderRef(), amount, message: `Tax Rs.${amount} paid for PAN ${accountRef}` };
  }
}

export class TrafficFineAdapter implements PaymentAdapter {
  readonly providerId = 'GOV_TRAFFIC_FINE';
  readonly providerName = 'Traffic Fine';
  readonly category = 'GOVERNMENT';
  readonly logoUrl = '/logos/traffic.png';
  readonly requiresInquiry = true;
  readonly fixedAmount = true;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(400);
    return { success: true, accountRef, customerName: 'Vehicle Owner', amount: 1000, additionalInfo: { vehicleNo: accountRef, offense: 'Speed Limit Violation' } };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(500);
    return { success: true, providerRef: mockProviderRef(), amount, message: `Traffic fine Rs.${amount} paid for ${accountRef}` };
  }
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────

export class OTTSubscriptionAdapter implements PaymentAdapter {
  readonly providerId = 'SUBSCRIPTION_OTT';
  readonly providerName = 'OTT Subscription';
  readonly category = 'SUBSCRIPTION';
  readonly logoUrl = '/logos/ott.png';
  readonly requiresInquiry = false;
  readonly fixedAmount = false;

  async inquire(accountRef: string): Promise<BillInquiryResult> {
    await mockDelay(200);
    return { success: true, accountRef, customerName: 'Subscriber' };
  }

  async pay(accountRef: string, amount: number): Promise<BillPayResult> {
    await mockDelay(400);
    return { success: true, providerRef: mockProviderRef(), amount, message: `OTT subscription Rs.${amount} paid` };
  }
}

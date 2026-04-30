import { PaymentAdapter } from './payment-adapter.interface';
import {
  NcellTopupAdapter, NtcTopupAdapter, SmartCellAdapter,
  NeaPrepaidAdapter, NeaPostpaidAdapter,
  WorldlinkAdapter, VianetAdapter, SubisuAdapter, ClassicTechAdapter,
  DishHomeTVAdapter, NetTVAdapter,
  WaterMunicipalAdapter,
  SchoolFeeAdapter, CollegeFeeAdapter, ExamFeeAdapter,
  LifeInsuranceAdapter, HealthInsuranceAdapter, VehicleInsuranceAdapter,
  TaxPaymentAdapter, TrafficFineAdapter,
  OTTSubscriptionAdapter,
} from './mock.adapters';

// ═══════════════════════════════════════════════════════════════
// ADAPTER REGISTRY
// Central registry for all payment providers.
// Used by both PaymentsService (HTTP) and PaymentProcessor (Background)
// ═══════════════════════════════════════════════════════════════

export const adapterMap = new Map<string, PaymentAdapter>();

const allAdapters: PaymentAdapter[] = [
  // Mobile
  new NcellTopupAdapter(), new NtcTopupAdapter(), new SmartCellAdapter(),
  // Electricity
  new NeaPrepaidAdapter(), new NeaPostpaidAdapter(),
  // Internet
  new WorldlinkAdapter(), new VianetAdapter(), new SubisuAdapter(), new ClassicTechAdapter(),
  // TV
  new DishHomeTVAdapter(), new NetTVAdapter(),
  // Water
  new WaterMunicipalAdapter(),
  // Education
  new SchoolFeeAdapter(), new CollegeFeeAdapter(), new ExamFeeAdapter(),
  // Insurance
  new LifeInsuranceAdapter(), new HealthInsuranceAdapter(), new VehicleInsuranceAdapter(),
  // Government
  new TaxPaymentAdapter(), new TrafficFineAdapter(),
  // Subscriptions
  new OTTSubscriptionAdapter(),
];

allAdapters.forEach((adapter) => {
  adapterMap.set(adapter.providerId, adapter);
});

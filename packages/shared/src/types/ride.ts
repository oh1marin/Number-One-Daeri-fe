export type RideStatus =
  | "PENDING"
  | "MATCHED"
  | "ACCEPTED"
  | "ARRIVED"
  | "DRIVING"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type RideType = "PREMIUM" | "QUICK" | "NORMAL";

export type PaymentMethod = "CARD" | "CASH" | "MILEAGE";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type CancelledBy = "USER" | "DRIVER" | "SYSTEM" | "ADMIN";

export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  "PENDING",
  "MATCHED",
  "ACCEPTED",
  "ARRIVED",
  "DRIVING",
];

export const TERMINAL_RIDE_STATUSES: RideStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "FAILED",
];

export function isActiveRide(status: RideStatus): boolean {
  return ACTIVE_RIDE_STATUSES.includes(status);
}

export function isTerminalRide(status: RideStatus): boolean {
  return TERMINAL_RIDE_STATUSES.includes(status);
}

export interface RideDto {
  id: string;
  status: RideStatus;
  type: RideType;
  userId: string;
  driverId: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  actualFare: number | null;
  paymentMethod: PaymentMethod;
  cancelledBy: CancelledBy | null;
  cancellationFee: number | null;
  createdAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface CreateRideRequest {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  type: RideType;
  paymentMethod: PaymentMethod;
  cardId?: string;
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
}

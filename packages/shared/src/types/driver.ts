export type DriverStatus = "OFFLINE" | "ONLINE" | "BUSY";

export type DriverApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface DriverDto {
  id: string;
  name: string;
  phone: string;
  approvalStatus: DriverApprovalStatus;
  status: DriverStatus;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleYear: number;
  currentLat: number | null;
  currentLng: number | null;
  rating: number;
  totalRides: number;
}

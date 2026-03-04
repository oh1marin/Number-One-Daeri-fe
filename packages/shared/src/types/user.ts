export type Role = "USER" | "DRIVER" | "ADMIN";

export interface UserDto {
  id: string;
  phone: string;
  name: string;
  role: Role;
  mileageBalance: number;
  referralCode: string;
  createdAt: string;
}

export interface CardDto {
  id: string;
  cardName: string;
  last4: string;
  isDefault: boolean;
}

import { COMPANY } from "@/lib/companyInfo";

type Props = {
  variant?: "default" | "compact" | "legal";
  className?: string;
};

export default function BusinessInfoBlock({ variant = "default", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <div className={`text-sm text-gray-600 space-y-1 ${className}`}>
        <p>
          <span className="font-medium text-gray-800">{COMPANY.serviceName}</span> · {COMPANY.developerName} · 대표{" "}
          {COMPANY.representative}
        </p>
        <p>
          사업자등록번호 {COMPANY.businessRegistrationNumber} · {COMPANY.addressLabel}: {COMPANY.fullAddress}
        </p>
      </div>
    );
  }

  if (variant === "legal") {
    return (
      <div className={`rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 space-y-1 ${className}`}>
        <div>상호: {COMPANY.serviceName}</div>
        <div>
          개발·운영: {COMPANY.developerName} | 대표: {COMPANY.representative} | 사업자등록번호:{" "}
          {COMPANY.businessRegistrationNumber}
        </div>
        <div>
          {COMPANY.addressLabel}: {COMPANY.fullAddress}
        </div>
        <div>
          전화: {COMPANY.phone} / 고객센터 {COMPANY.customerCenter}
        </div>
        <div>이메일: {COMPANY.email}</div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-6 ${className}`}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">사업자 정보</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-gray-500 font-medium">상호</dt>
        <dd className="text-gray-900">{COMPANY.serviceName}</dd>
        <dt className="text-gray-500 font-medium">개발·운영</dt>
        <dd className="text-gray-900">{COMPANY.developerName}</dd>
        <dt className="text-gray-500 font-medium">대표자</dt>
        <dd className="text-gray-900">{COMPANY.representative}</dd>
        <dt className="text-gray-500 font-medium">사업자등록번호</dt>
        <dd className="text-gray-900 tabular-nums">{COMPANY.businessRegistrationNumber}</dd>
        <dt className="text-gray-500 font-medium">{COMPANY.addressLabel}</dt>
        <dd className="text-gray-900">
          {COMPANY.addressLine1}
          <br />
          {COMPANY.addressLine2}
        </dd>
        <dt className="text-gray-500 font-medium">연락처</dt>
        <dd className="text-gray-900">
          전화 {COMPANY.phone} · 고객센터{" "}
          <a href={`tel:${COMPANY.customerCenter}`} className="text-brand hover:underline">
            {COMPANY.customerCenter}
          </a>
          <br />
          이메일{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-brand hover:underline">
            {COMPANY.email}
          </a>
        </dd>
      </dl>
    </div>
  );
}

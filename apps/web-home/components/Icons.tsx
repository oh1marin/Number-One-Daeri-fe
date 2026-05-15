/**
 * 무료 SVG 아이콘 — react-icons (Lucide, Phosphor, Tabler, Feather 등)
 * https://react-icons.github.io/react-icons/
 */
import { LuZap, LuShield, LuCreditCard, LuMapPin, LuClock, LuMessageCircle } from "react-icons/lu";
import { PiMapTrifoldLight, PiShieldCheck, PiSparkle, PiHandshake } from "react-icons/pi";
import { TbMapPin, TbPhone, TbMail } from "react-icons/tb";
import { MdCheckCircle } from "react-icons/md";

const iconClass = "w-8 h-8 text-brand";

export const FeatureIcons = {
  fast: <LuZap className={iconClass} />,
  safe: <LuShield className={iconClass} />,
  payment: <LuCreditCard className={iconClass} />,
  tracking: <LuMapPin className={iconClass} />,
  hours: <LuClock className={iconClass} />,
  support: <LuMessageCircle className={iconClass} />,
};

export const ValueIcons = {
  safe: <PiShieldCheck className={iconClass} />,
  fast: <LuZap className={iconClass} />,
  trust: <PiSparkle className={iconClass} />,
  together: <PiHandshake className={iconClass} />,
  /** 회사소개 — 상생 대체 등 */
  comfort: <LuMessageCircle className={iconClass} />,
};

export const ContactIcons = {
  phone: <TbPhone className="w-7 h-7 text-brand" />,
  email: <TbMail className="w-7 h-7 text-brand" />,
};

export const LocationIcons = {
  pin: <TbMapPin className="w-6 h-6 text-brand" />,
  phone: <TbPhone className="w-6 h-6 text-brand" />,
  email: <TbMail className="w-6 h-6 text-brand" />,
};

export const MapFallbackIcon = (
  <PiMapTrifoldLight className="w-16 h-16 text-gray-400" />
);

export const SuccessIcon = (
  <MdCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
);

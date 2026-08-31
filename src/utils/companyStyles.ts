import { Company } from '../types';

export interface CompanyTheme {
  name: Company;
  shortName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  cardBorder: string;
  hoverBg: string;
  accentColor: string;
  gradient: string;
  avatarBg: string;
}

export const COMPANY_THEMES: Record<Company, CompanyTheme> = {
  'Nexia Mongolia': {
    name: 'Nexia Mongolia',
    shortName: 'Nexia',
    badgeBg: 'bg-[#e6fcf3] dark:bg-[#064e3b]/30',
    badgeText: 'text-[#059669] dark:text-[#34d399]',
    badgeBorder: 'border-[#a7f3d0] dark:border-[#059669]/40',
    cardBg: 'bg-white dark:bg-[#141a24]',
    cardBorder: 'border-[#e5e5e5] dark:border-[#263244]',
    hoverBg: 'hover:bg-[#f9fafb] dark:hover:bg-[#1a2230]',
    accentColor: '#01fe93',
    gradient: 'from-[#059669] to-[#10b981]',
    avatarBg: 'bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40'
  },
  'McKenzie': {
    name: 'McKenzie',
    shortName: 'McKenzie',
    badgeBg: 'bg-[#eef2ff] dark:bg-[#312e81]/30',
    badgeText: 'text-[#4f46e5] dark:text-[#818cf8]',
    badgeBorder: 'border-[#c7d2fe] dark:border-[#6366f1]/40',
    cardBg: 'bg-white dark:bg-[#141a24]',
    cardBorder: 'border-[#e5e5e5] dark:border-[#263244]',
    hoverBg: 'hover:bg-[#f9fafb] dark:hover:bg-[#1a2230]',
    accentColor: '#5f79ff',
    gradient: 'from-[#5f79ff] to-[#4338ca]',
    avatarBg: 'bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#4f46e5] dark:text-[#818cf8] border border-[#c7d2fe] dark:border-[#6366f1]/40'
  }
};

export const getCompanyTheme = (company?: string | null): CompanyTheme => {
  if (company && (company.includes('McKenzie') || company.toLowerCase().includes('mckenzie'))) {
    return COMPANY_THEMES['McKenzie'];
  }
  return COMPANY_THEMES['Nexia Mongolia'];
};

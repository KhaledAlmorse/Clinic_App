import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ar";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    patients: "Patients",
    appointments: "Appointments",
    visits: "Visits",
    prescriptions: "Prescriptions",
    invoices: "Billing",
    logout: "Logout",
    login: "Login",
    email: "Email",
    password: "Password",
    // Add more as needed
  },
  ar: {
    dashboard: "لوحة القيادة",
    patients: "المرضى",
    appointments: "المواعيد",
    visits: "الزيارات",
    prescriptions: "الوصفات الطبية",
    invoices: "الفواتير",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("clinic_language") as Language;
    return stored === "ar" ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem("clinic_language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRtl: language === "ar" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "ar";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    patients: "Patients",
    appointments: "Appointments",
    visits: "Medical Records",
    prescriptions: "Prescriptions",
    invoices: "Billing",
    logout: "Logout",
    login: "Sign In",
    email: "Email",
    password: "Password",
    name: "Name",
    phone: "Phone",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    status: "Status",
    date: "Date",
    doctor: "Doctor",
    patient: "Patient",
    actions: "Actions",
    notes: "Notes",
    diagnosis: "Diagnosis",
    treatment: "Treatment",
    medications: "Medications",
    amount: "Amount",
    total: "Total",
    paid: "Paid",
    pending: "Pending",
    cancelled: "Cancelled",
    settings: "Settings",
    print: "Print",
    new: "New",
    back: "Back",
    loading: "Loading...",
    noResults: "No results found",
    "appointment.type": "Type",
    "appointment.scheduled": "Scheduled",
    "appointment.completed": "Completed",
    "appointment.cancelled": "Cancelled",
  },
  ar: {
    dashboard: "لوحة التحكم",
    patients: "المرضى",
    appointments: "المواعيد",
    visits: "السجلات الطبية",
    prescriptions: "الوصفات الطبية",
    invoices: "الفواتير",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    name: "الاسم",
    phone: "الهاتف",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    search: "بحث",
    status: "الحالة",
    date: "التاريخ",
    doctor: "الطبيب",
    patient: "المريض",
    actions: "إجراءات",
    notes: "ملاحظات",
    diagnosis: "التشخيص",
    treatment: "العلاج",
    medications: "الأدوية",
    amount: "المبلغ",
    total: "الإجمالي",
    paid: "مدفوع",
    pending: "معلق",
    cancelled: "ملغى",
    settings: "الإعدادات",
    print: "طباعة",
    new: "جديد",
    back: "رجوع",
    loading: "جاري التحميل...",
    noResults: "لا توجد نتائج",
    "appointment.type": "النوع",
    "appointment.scheduled": "مجدول",
    "appointment.completed": "مكتمل",
    "appointment.cancelled": "ملغى",
  }
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("clinic_lang") as Lang) || "en");

  const setLang = (l: Lang) => {
    localStorage.setItem("clinic_lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => translations[lang][key] ?? translations["en"][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl: lang === "ar" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

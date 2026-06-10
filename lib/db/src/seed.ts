import { db } from "./index";
import { usersTable } from "./schema/users";
import { patientsTable } from "./schema/patients";
import { appointmentsTable } from "./schema/appointments";
import { visitsTable } from "./schema/visits";
import { prescriptionsTable } from "./schema/prescriptions";
import { invoicesTable } from "./schema/invoices";
import { activityLogTable } from "./schema/activity_log";
import { eq, sql } from "drizzle-orm";

const DEMO_USERS = [
  {
    name: "System Admin",
    email: "admin@clinicdesk.com",
    role: "admin",
    passwordHash:
      "$2b$10$E5tqSsMV.V4Jbe.TQ/IKPu0TnPt8IvGhrLQor3RQR14EUPZUoqH52",
  },
  {
    name: "Dr. Smith",
    email: "doctor@clinicdesk.com",
    role: "doctor",
    specialty: "General Medicine",
    passwordHash:
      "$2b$10$RVpQaEINOa1xCNiPLRhUh.d1y/J3O1qMP.2wipbuGzud94JiBkuAa",
  },
  {
    name: "Dr. Sara Ali",
    email: "doctor2@clinicdesk.com",
    role: "doctor",
    specialty: "Pediatrics",
    passwordHash:
      "$2b$10$RVpQaEINOa1xCNiPLRhUh.d1y/J3O1qMP.2wipbuGzud94JiBkuAa",
  },
  {
    name: "Jane Doe",
    email: "receptionist@clinicdesk.com",
    role: "receptionist",
    passwordHash:
      "$2b$10$3mfSU7ZAFlnTVMW27U/A/eaI.1GZN3C5ziPad5uST5YyN2O1TnNHa",
  },
  {
    name: "Ali Hassan",
    email: "patient@clinicdesk.com",
    role: "patient",
    passwordHash:
      "$2b$10$3mfSU7ZAFlnTVMW27U/A/eaI.1GZN3C5ziPad5uST5YyN2O1TnNHa",
  },
];

const SAMPLE_PATIENTS = [
  {
    name: "Omar Ahmad",
    email: "omar@example.com",
    phone: "+971501234001",
    dateOfBirth: "1985-03-15",
    gender: "male",
    bloodType: "A+",
    address: "Dubai, UAE",
    allergies: "Penicillin",
    emergencyContact: "Fatima Ahmad - +971501234101",
  },
  {
    name: "Layla Hassan",
    email: "layla@example.com",
    phone: "+971501234002",
    dateOfBirth: "1992-07-22",
    gender: "female",
    bloodType: "O-",
    address: "Abu Dhabi, UAE",
    allergies: "",
    emergencyContact: "Hassan Ali - +971501234102",
  },
  {
    name: "Khalid Nasser",
    email: "khalid@example.com",
    phone: "+971501234003",
    dateOfBirth: "1978-11-08",
    gender: "male",
    bloodType: "B+",
    address: "Sharjah, UAE",
    allergies: "Sulfa drugs",
    emergencyContact: "Nora Khalid - +971501234103",
  },
  {
    name: "Mariam Sultan",
    email: "mariam@example.com",
    phone: "+971501234004",
    dateOfBirth: "1995-01-30",
    gender: "female",
    bloodType: "AB+",
    address: "Dubai, UAE",
    allergies: "",
    emergencyContact: "Sultan Rashid - +971501234104",
  },
  {
    name: "Ahmed Faisal",
    email: "ahmed@example.com",
    phone: "+971501234005",
    dateOfBirth: "2000-09-12",
    gender: "male",
    bloodType: "O+",
    address: "Ajman, UAE",
    allergies: "Peanuts",
    emergencyContact: "Faisal Ahmed - +971501234105",
  },
  {
    name: "Noora Salem",
    email: "noora@example.com",
    phone: "+971501234006",
    dateOfBirth: "1988-06-05",
    gender: "female",
    bloodType: "A-",
    address: "Dubai, UAE",
    allergies: "",
    emergencyContact: "Salem Ali - +971501234106",
  },
  {
    name: "Saeed Rashid",
    email: "saeed@example.com",
    phone: "+971501234007",
    dateOfBirth: "1965-12-18",
    gender: "male",
    bloodType: "B-",
    address: "Ras Al Khaimah, UAE",
    allergies: "Ibuprofen",
    emergencyContact: "Mona Saeed - +971501234107",
  },
  {
    name: "Hind Ibrahim",
    email: "hind@example.com",
    phone: "+971501234008",
    dateOfBirth: "2002-04-25",
    gender: "female",
    bloodType: "AB-",
    address: "Fujairah, UAE",
    allergies: "",
    emergencyContact: "Ibrahim Noor - +971501234108",
  },
];

const MEDICATIONS_LIST = [
  {
    name: "Amoxicillin",
    dosage: "500mg",
    frequency: "3 times daily",
    duration: "7 days",
    instructions: "Take after meals",
  },
  {
    name: "Paracetamol",
    dosage: "650mg",
    frequency: "4 times daily",
    duration: "5 days",
    instructions: "As needed for fever",
  },
  {
    name: "Omeprazole",
    dosage: "20mg",
    frequency: "Once daily",
    duration: "14 days",
    instructions: "Take before breakfast",
  },
  {
    name: "Atorvastatin",
    dosage: "10mg",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "Take at bedtime",
  },
  {
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "30 days",
    instructions: "Take with meals",
  },
  {
    name: "Lisinopril",
    dosage: "5mg",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "For blood pressure",
  },
  {
    name: "Salbutamol Inhaler",
    dosage: "100mcg",
    frequency: "As needed",
    duration: "30 days",
    instructions: "2 puffs when wheezing",
  },
  {
    name: "Cetirizine",
    dosage: "10mg",
    frequency: "Once daily",
    duration: "10 days",
    instructions: "For allergies",
  },
];

const APPOINTMENT_TYPES = [
  "consultation",
  "follow_up",
  "checkup",
  "procedure",
] as const;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding ClinicDesk...");
  
  console.log("Truncating tables...");
  await db.execute(sql`TRUNCATE TABLE doctor_schedules, visit_attachments, activity_log, invoices, prescriptions, visits, appointments, patients, users RESTART IDENTITY CASCADE;`);

  // Helper: find or create
  const userIds: Record<string, number> = {};
  for (const u of DEMO_USERS) {
    let [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, u.email));
    if (!existing) {
      [existing] = await db.insert(usersTable).values(u).returning();
      console.log(`Created user: ${u.email}`);
    } else {
      console.log(`User exists: ${u.email}`);
    }
    userIds[u.email] = existing.id;
  }

  const adminId = userIds["admin@clinicdesk.com"];
  const doctor1Id = userIds["doctor@clinicdesk.com"];
  const doctor2Id = userIds["doctor2@clinicdesk.com"];
  const receptionistId = userIds["receptionist@clinicdesk.com"];

  // Seed patients
  const patientIds: number[] = [];
  for (const p of SAMPLE_PATIENTS) {
    let [existing] = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.email, p.email));
    if (!existing) {
      [existing] = await db.insert(patientsTable).values(p).returning();
      console.log(`Created patient: ${p.name}`);
    } else {
      console.log(`Patient exists: ${p.name}`);
    }
    patientIds.push(existing.id);
  }

  // Seed appointments (some today, some past, some future)
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const appointmentsToCreate = [
    {
      patientIdx: 0,
      doctorId: doctor1Id,
      dayOffset: 0,
      hour: 9,
      min: 0,
      type: "consultation" as const,
      status: "confirmed" as const,
    },
    {
      patientIdx: 1,
      doctorId: doctor1Id,
      dayOffset: 0,
      hour: 10,
      min: 30,
      type: "checkup" as const,
      status: "scheduled" as const,
    },
    {
      patientIdx: 2,
      doctorId: doctor2Id,
      dayOffset: 0,
      hour: 11,
      min: 0,
      type: "consultation" as const,
      status: "confirmed" as const,
    },
    {
      patientIdx: 3,
      doctorId: doctor2Id,
      dayOffset: 0,
      hour: 14,
      min: 0,
      type: "follow_up" as const,
      status: "scheduled" as const,
    },
    {
      patientIdx: 4,
      doctorId: doctor1Id,
      dayOffset: -2,
      hour: 9,
      min: 0,
      type: "consultation" as const,
      status: "completed" as const,
    },
    {
      patientIdx: 5,
      doctorId: doctor1Id,
      dayOffset: -1,
      hour: 10,
      min: 0,
      type: "checkup" as const,
      status: "completed" as const,
    },
    {
      patientIdx: 0,
      doctorId: doctor2Id,
      dayOffset: -3,
      hour: 15,
      min: 0,
      type: "follow_up" as const,
      status: "completed" as const,
    },
    {
      patientIdx: 6,
      doctorId: doctor1Id,
      dayOffset: 1,
      hour: 8,
      min: 30,
      type: "consultation" as const,
      status: "scheduled" as const,
    },
    {
      patientIdx: 7,
      doctorId: doctor2Id,
      dayOffset: 1,
      hour: 13,
      min: 0,
      type: "procedure" as const,
      status: "scheduled" as const,
    },
    {
      patientIdx: 2,
      doctorId: doctor1Id,
      dayOffset: -5,
      hour: 11,
      min: 0,
      type: "consultation" as const,
      status: "completed" as const,
    },
    {
      patientIdx: 3,
      doctorId: doctor2Id,
      dayOffset: -7,
      hour: 9,
      min: 30,
      type: "consultation" as const,
      status: "cancelled" as const,
    },
    {
      patientIdx: 1,
      doctorId: doctor1Id,
      dayOffset: 2,
      hour: 10,
      min: 0,
      type: "follow_up" as const,
      status: "scheduled" as const,
    },
  ];

  const appointmentIds: number[] = [];
  for (const a of appointmentsToCreate) {
    const scheduledAt = setTime(addDays(now, a.dayOffset), a.hour, a.min);
    const values = {
      patientId: patientIds[a.patientIdx],
      doctorId: a.doctorId,
      scheduledAt,
      status: a.status,
      type: a.type,
      notes: a.status === "completed" ? "Patient seen, all good." : null,
    };
    const [appt] = await db
      .insert(appointmentsTable)
      .values(values)
      .returning();
    appointmentIds.push(appt.id);
  }
  console.log(`Created ${appointmentsToCreate.length} appointments`);

  // Seed visits (for completed appointments and a few extras)
  const visitsData = [
    {
      patientIdx: 4,
      doctorId: doctor1Id,
      apptOffset: 4,
      diagnosis: "Upper respiratory tract infection",
      complaint: "Cough and fever for 3 days",
      exam: "Temperature 38.5°C, throat inflamed",
      lab: "CBC normal",
      treatment: "Rest, fluids, Amoxicillin",
    },
    {
      patientIdx: 5,
      doctorId: doctor1Id,
      apptOffset: 5,
      diagnosis: "Hypertension follow-up",
      complaint: "Routine check-up",
      exam: "BP 135/85, pulse normal",
      lab: "Lipid panel normal",
      treatment: "Continue Lisinopril, exercise",
    },
    {
      patientIdx: 0,
      doctorId: doctor2Id,
      apptOffset: 6,
      diagnosis: "Seasonal allergies",
      complaint: "Sneezing, itchy eyes",
      exam: "Conjunctival redness",
      lab: "",
      treatment: "Cetirizine 10mg daily",
    },
    {
      patientIdx: 2,
      doctorId: doctor1Id,
      apptOffset: 9,
      diagnosis: "Type 2 Diabetes monitoring",
      complaint: "Follow-up, feels well",
      exam: "BP 120/80, weight stable",
      lab: "HbA1c 6.8%",
      treatment: "Continue Metformin",
    },
  ];

  for (const v of visitsData) {
    const visitDate = addDays(now, appointmentsToCreate[v.apptOffset].dayOffset)
      .toISOString()
      .split("T")[0];
    const [visit] = await db
      .insert(visitsTable)
      .values({
        patientId: patientIds[v.patientIdx],
        doctorId: v.doctorId,
        appointmentId: appointmentIds[v.apptOffset],
        visitDate,
        chiefComplaint: v.complaint,
        diagnosis: v.diagnosis,
        examinationNotes: v.exam,
        labResults: v.lab,
        treatmentPlan: v.treatment,
      })
      .returning();
    console.log(
      `Created visit #${visit.id} for ${SAMPLE_PATIENTS[v.patientIdx].name}`,
    );
  }

  // Seed prescriptions
  await db.insert(prescriptionsTable).values({
    patientId: patientIds[4],
    doctorId: doctor1Id,
    visitId: 1,
    medications: [MEDICATIONS_LIST[0], MEDICATIONS_LIST[1]],
    notes: "Take as directed",
    issuedAt: addDays(now, -2).toISOString().split("T")[0],
  });
  await db.insert(prescriptionsTable).values({
    patientId: patientIds[0],
    doctorId: doctor2Id,
    visitId: 3,
    medications: [MEDICATIONS_LIST[7]],
    notes: "For seasonal allergies",
    issuedAt: addDays(now, -3).toISOString().split("T")[0],
  });
  await db.insert(prescriptionsTable).values({
    patientId: patientIds[2],
    doctorId: doctor1Id,
    visitId: 4,
    medications: [MEDICATIONS_LIST[4]],
    notes: "Check blood sugar regularly",
    issuedAt: addDays(now, -5).toISOString().split("T")[0],
  });
  console.log("Created 3 prescriptions");

  // Seed invoices
  const invoicesData = [
    {
      patientIdx: 4,
      total: 350,
      paid: 350,
      status: "paid" as const,
      itemDesc: ["Consultation fee", "Lab tests"],
      itemQuant: [1, 1],
      itemPrices: [200, 150],
    },
    {
      patientIdx: 5,
      total: 200,
      paid: 200,
      status: "paid" as const,
      itemDesc: ["Check-up"],
      itemQuant: [1],
      itemPrices: [200],
    },
    {
      patientIdx: 0,
      total: 180,
      paid: 100,
      status: "partial" as const,
      itemDesc: ["Consultation", "Medication"],
      itemQuant: [1, 1],
      itemPrices: [100, 80],
    },
    {
      patientIdx: 1,
      total: 500,
      paid: 0,
      status: "pending" as const,
      itemDesc: ["Consultation fee", "Lab tests", "X-Ray"],
      itemQuant: [1, 1, 1],
      itemPrices: [150, 200, 150],
    },
    {
      patientIdx: 3,
      total: 250,
      paid: 250,
      status: "paid" as const,
      itemDesc: ["Follow-up consultation"],
      itemQuant: [1],
      itemPrices: [250],
    },
  ];

  for (const inv of invoicesData) {
    const items = inv.itemDesc.map((d, i) => ({
      description: d,
      quantity: inv.itemQuant[i],
      unitPrice: inv.itemPrices[i],
      total: inv.itemQuant[i] * inv.itemPrices[i],
    }));
    const today = new Date();
    const issuedAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      Math.max(1, today.getDate() - 5),
    )
      .toISOString()
      .split("T")[0];
    await db.insert(invoicesTable).values({
      patientId: patientIds[inv.patientIdx],
      totalAmount: inv.total.toFixed(2),
      paidAmount: inv.paid.toFixed(2),
      status: inv.status,
      items,
      issuedAt,
      dueDate: addDays(now, 15).toISOString().split("T")[0],
      notes:
        inv.status === "pending" ? "Payment expected within 15 days" : null,
    });
    console.log(
      `Created ${inv.status} invoice for ${SAMPLE_PATIENTS[inv.patientIdx].name}`,
    );
  }

  // Seed activity log
  const activities = [
    {
      type: "patient_created",
      description: "New patient registered: Omar Ahmad",
    },
    {
      type: "patient_created",
      description: "New patient registered: Layla Hassan",
    },
    {
      type: "patient_created",
      description: "New patient registered: Khalid Nasser",
    },
    {
      type: "appointment_booked",
      description: "Appointment booked for patient #1 with Dr. Smith",
    },
    {
      type: "appointment_booked",
      description: "Appointment booked for patient #2 with Dr. Smith",
    },
    {
      type: "visit_recorded",
      description: "Medical visit recorded for patient #5",
    },
    {
      type: "prescription_issued",
      description: "Prescription issued for patient #5",
    },
    {
      type: "invoice_created",
      description: "Invoice created for patient #5 - $350.00",
    },
    {
      type: "payment_recorded",
      description: "Payment of $350.00 recorded for invoice #1",
    },
    {
      type: "invoice_created",
      description: "Invoice created for patient #2 - $500.00",
    },
  ];

  const activityValues = activities.map((a, i) => ({
    ...a,
    userId: i % 2 === 0 ? receptionistId : adminId,
    createdAt: new Date(Date.now() - i * 3600000),
  }));
  await db.insert(activityLogTable).values(activityValues);
  console.log("Created activity log entries");

  console.log("Seeding completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

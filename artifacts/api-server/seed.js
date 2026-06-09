import { 
  db, 
  usersTable, 
  patientsTable, 
  appointmentsTable, 
  visitsTable, 
  prescriptionsTable, 
  invoicesTable, 
  activityLogTable 
} from '@workspace/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Truncating tables...');
  // Truncate all tables and reset serial IDs
  await db.execute(sql`TRUNCATE TABLE activity_log, invoices, prescriptions, visits, appointments, patients, users RESTART IDENTITY CASCADE;`);

  console.log('Seeding users...');
  const users = [
    { name: 'Admin User', email: 'admin@clinicdesk.com', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { name: 'Dr. Elizabeth Blackwell', email: 'doctor@clinicdesk.com', passwordHash: bcrypt.hashSync('doctor123', 10), role: 'doctor', specialty: 'General Medicine' },
    { name: 'Sarah receptionist', email: 'receptionist@clinicdesk.com', passwordHash: bcrypt.hashSync('recept123', 10), role: 'receptionist' }
  ];
  const seededUsers = await db.insert(usersTable).values(users).returning();
  const doctor = seededUsers.find(u => u.role === 'doctor');
  const receptionist = seededUsers.find(u => u.role === 'receptionist');

  console.log('Seeding patients...');
  const patients = [
    { 
      name: 'John Doe', 
      email: 'john.doe@example.com', 
      phone: '+1 555-0199', 
      dateOfBirth: '1985-05-15', 
      gender: 'male', 
      bloodType: 'O+', 
      address: '123 Broadway, New York, NY', 
      allergies: 'Penicillin', 
      emergencyContact: 'Jane Doe (+1 555-0198)',
      notes: 'History of lower back pain.'
    },
    { 
      name: 'Jane Smith', 
      email: 'jane.smith@example.com', 
      phone: '+1 555-0144', 
      dateOfBirth: '1990-08-20', 
      gender: 'female', 
      bloodType: 'A-', 
      address: '456 Elm St, Los Angeles, CA', 
      allergies: 'None', 
      emergencyContact: 'Robert Smith (+1 555-0145)',
      notes: 'Routine checkups, pregnant (2nd trimester).'
    }
  ];
  const seededPatients = await db.insert(patientsTable).values(patients).returning();
  const patientJohn = seededPatients[0];
  const patientJane = seededPatients[1];

  console.log('Seeding appointments...');
  const appointments = [
    {
      patientId: patientJohn.id,
      doctorId: doctor.id,
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      duration: 30,
      status: 'completed',
      type: 'consultation',
      notes: 'John complained of severe back pain.'
    },
    {
      patientId: patientJane.id,
      doctorId: doctor.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      status: 'scheduled',
      type: 'checkup',
      notes: 'Routine prenatal follow-up.'
    }
  ];
  const seededAppointments = await db.insert(appointmentsTable).values(appointments).returning();
  const appointmentJohn = seededAppointments[0];

  console.log('Seeding visits...');
  const visits = [
    {
      patientId: patientJohn.id,
      doctorId: doctor.id,
      appointmentId: appointmentJohn.id,
      visitDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      chiefComplaint: 'Severe lower back pain for the past 3 days after lifting heavy boxes.',
      diagnosis: 'Acute lumbar muscle strain',
      examinationNotes: 'Tenderness at L4-L5 lumbar region. Range of motion limited by pain. Straight leg raise test negative.',
      labResults: 'N/A',
      treatmentPlan: 'Physical rest for 3 days. Heat application. Avoid heavy lifting. Follow up in 1 week if pain persists.',
      followUpDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 days from now
    }
  ];
  const seededVisits = await db.insert(visitsTable).values(visits).returning();
  const visitJohn = seededVisits[0];

  console.log('Seeding prescriptions...');
  const prescriptions = [
    {
      patientId: patientJohn.id,
      doctorId: doctor.id,
      visitId: visitJohn.id,
      medications: [
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'Three times daily with food', duration: '5 days' },
        { name: 'Cyclobenzaprine', dosage: '5mg', frequency: 'Once daily before bedtime', duration: '3 days' }
      ],
      notes: 'May cause drowsiness. Do not consume alcohol.',
      issuedAt: visitJohn.visitDate
    }
  ];
  await db.insert(prescriptionsTable).values(prescriptions);

  console.log('Seeding invoices...');
  const invoices = [
    {
      patientId: patientJohn.id,
      visitId: visitJohn.id,
      totalAmount: '150.00',
      paidAmount: '150.00',
      status: 'paid',
      items: [
        { description: 'Physician Consultation', quantity: 1, price: '100.00' },
        { description: 'Therapeutic Lumbar Massage', quantity: 1, price: '50.00' }
      ],
      notes: 'Paid fully by patient via cash.',
      issuedAt: visitJohn.visitDate,
      dueDate: visitJohn.visitDate
    },
    {
      patientId: patientJane.id,
      totalAmount: '80.00',
      paidAmount: '0.00',
      status: 'pending',
      items: [
        { description: 'Prenatal Routine Scan', quantity: 1, price: '80.00' }
      ],
      notes: 'Awaiting insurance approval.',
      issuedAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];
  await db.insert(invoicesTable).values(invoices);

  console.log('Seeding activity logs...');
  const activityLogs = [
    {
      type: 'patient_created',
      description: `Patient ${patientJohn.name} registered by receptionist ${receptionist.name}`,
      entityId: patientJohn.id,
      userId: receptionist.id
    },
    {
      type: 'patient_created',
      description: `Patient ${patientJane.name} registered by receptionist ${receptionist.name}`,
      entityId: patientJane.id,
      userId: receptionist.id
    },
    {
      type: 'appointment_booked',
      description: `Appointment booked for ${patientJohn.name} with ${doctor.name}`,
      entityId: appointmentJohn.id,
      userId: receptionist.id
    },
    {
      type: 'invoice_paid',
      description: `Invoice for ${patientJohn.name} marked as PAID. Amount: $150.00`,
      entityId: 1,
      userId: receptionist.id
    }
  ];
  await db.insert(activityLogTable).values(activityLogs);

  console.log('Database seeded successfully!');
}

main().catch(console.error).then(() => process.exit(0));

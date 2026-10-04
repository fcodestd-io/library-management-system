import { relations } from "drizzle-orm";
import { users } from "./users";
import { members } from "./members";
import { rooms } from "./rooms";
import { racks } from "./racks";
import { categories } from "./categories";
import { books } from "./books";
import { bookCopies } from "./book-copies";
import { loans } from "./loans";
import { fines } from "./fines";
import { payments } from "./payments";

// ==========================================
// 1. RELASI ROOMS & RACKS
// ==========================================
export const roomsRelations = relations(rooms, ({ many }) => ({
  racks: many(racks),
}));

export const racksRelations = relations(racks, ({ one, many }) => ({
  room: one(rooms, {
    fields: [racks.roomId],
    references: [rooms.id],
  }),
  bookCopies: many(bookCopies),
}));

// ==========================================
// 2. RELASI CATEGORIES, BOOKS & BOOK COPIES
// ==========================================
export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
  copies: many(bookCopies),
}));

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
  book: one(books, {
    fields: [bookCopies.bookId],
    references: [books.id],
  }),
  rack: one(racks, {
    fields: [bookCopies.rackId],
    references: [racks.id],
  }),
  loans: many(loans),
}));

// ==========================================
// 3. RELASI LOANS (TRANSAKSI PEMINJAMAN)
// ==========================================
export const loansRelations = relations(loans, ({ one, many }) => ({
  // Anggota yang meminjam
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),

  // Eksemplar buku yang dipinjam
  bookCopy: one(bookCopies, {
    fields: [loans.bookCopyId],
    references: [bookCopies.id],
  }),

  // Petugas yang memproses peminjaman awal
  processedByStaff: one(users, {
    fields: [loans.processedBy],
    references: [users.id],
    relationName: "loan_processor",
  }),

  // Petugas yang memproses pengembalian buku
  returnedByStaff: one(users, {
    fields: [loans.returnedProcessedBy],
    references: [users.id],
    relationName: "return_processor",
  }),

  // Denda & Pembayaran terkait
  fines: many(fines),
  payments: many(payments),
}));

// ==========================================
// 4. RELASI FINES (DENDA)
// ==========================================
export const finesRelations = relations(fines, ({ one, many }) => ({
  loan: one(loans, {
    fields: [fines.loanId],
    references: [loans.id],
  }),
  payments: many(payments),
}));

// ==========================================
// 5. RELASI PAYMENTS (PEMBAYARAN UNIVERSAL)
// ==========================================
export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id],
  }),
  fine: one(fines, {
    fields: [payments.fineId],
    references: [fines.id],
  }),
  processor: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

// ==========================================
// 6. RELASI USERS & MEMBERS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  processedLoans: many(loans, { relationName: "loan_processor" }),
  processedReturns: many(loans, { relationName: "return_processor" }),
  processedPayments: many(payments),
}));

export const membersRelations = relations(members, ({ many }) => ({
  loans: many(loans),
  payments: many(payments),
}));

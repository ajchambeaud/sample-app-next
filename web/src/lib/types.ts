// DTOs shared by the data layer, Server Components and Client Components.
// Dates are ISO strings so every value is serializable across the RSC boundary.

export interface Tag {
  slug: string;
  displayText: string;
}

/** Public view of a book's current loan (no member data: book pages are public). */
export interface ActiveLoan {
  id: string;
  loanedAt: string;
  dueAt: string;
  overdue: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string | null;
  coverKey: string | null;
  coverUrl: string | null;
  ownerId: string;
  authorId: string | null;
  tags: Tag[];
  available: boolean;
  activeLoan: ActiveLoan | null;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  pictureKey: string | null;
  pictureUrl: string | null;
  tags: Tag[];
  books?: Book[];
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus = "active" | "overdue" | "returned";

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  loanedAt: string;
  dueAt: string;
  returnedAt: string | null;
  status: LoanStatus;
  /** Days past due for active loans (0 when on time); null once returned. */
  daysOverdue: number | null;
  book: { id: string; title: string; author: string } | null;
  member: { id: string; firstName: string; lastName: string; nationalId: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Shape returned by every form Server Action for useActionState. */
export interface ActionState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

export const DEFAULT_LOAN_DAYS = 14;
export const MAX_LOAN_DAYS = 90;
export const PAGE_SIZE = 20;

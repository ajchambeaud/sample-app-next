import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const uuid = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

// Librarians: the accounts that sign in and manage the catalog.
export const users = sqliteTable("users", {
  id: uuid(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  ...timestamps,
});

export const authors = sqliteTable("authors", {
  id: uuid(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  pictureKey: text("picture_key"),
  // Provenance only: authors are editable by any signed-in user.
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const books = sqliteTable(
  "books",
  {
    id: uuid(),
    title: text("title").notNull(),
    // Display name, always present even when no author profile is linked.
    author: text("author").notNull(),
    description: text("description").notNull().default(""),
    isbn: text("isbn"),
    coverKey: text("cover_key"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    authorId: text("author_id").references(() => authors.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("books_author_id_idx").on(t.authorId), index("books_created_at_idx").on(t.createdAt)]
);

// Free-form tags shared by books and authors, keyed by slug.
export const tags = sqliteTable("tags", {
  id: uuid(),
  slug: text("slug").notNull().unique(),
  displayText: text("display_text").notNull(),
  ...timestamps,
});

export const bookTags = sqliteTable(
  "book_tags",
  {
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.tagId] }), index("book_tags_tag_id_idx").on(t.tagId)]
);

export const authorTags = sqliteTable(
  "author_tags",
  {
    authorId: text("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.authorId, t.tagId] }), index("author_tags_tag_id_idx").on(t.tagId)]
);

// Library members: the people books are lent to. Holds personal data.
export const members = sqliteTable("members", {
  id: uuid(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nationalId: text("national_id").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  ...timestamps,
});

/**
 * A book lent to a member. Active while `returnedAt` is null; the partial
 * unique index guarantees at most one active loan per book at the database
 * level (the service layer also checks inside a transaction).
 */
export const loans = sqliteTable(
  "loans",
  {
    id: uuid(),
    bookId: text("book_id").notNull(),
    memberId: text("member_id").notNull(),
    // Librarian who registered the loan.
    createdById: text("created_by_id").notNull(),
    loanedAt: integer("loaned_at", { mode: "timestamp_ms" }).notNull(),
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    returnedAt: integer("returned_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("loans_one_active_per_book")
      .on(t.bookId)
      .where(sql`${t.returnedAt} IS NULL`),
    index("loans_member_id_idx").on(t.memberId),
    index("loans_returned_due_idx").on(t.returnedAt, t.dueAt),
  ]
);

// Relations for the relational query API (db.query.*).
export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(books),
  authorTags: many(authorTags),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  owner: one(users, { fields: [books.ownerId], references: [users.id] }),
  authorProfile: one(authors, { fields: [books.authorId], references: [authors.id] }),
  bookTags: many(bookTags),
  loans: many(loans),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookTags: many(bookTags),
  authorTags: many(authorTags),
}));

export const bookTagsRelations = relations(bookTags, ({ one }) => ({
  book: one(books, { fields: [bookTags.bookId], references: [books.id] }),
  tag: one(tags, { fields: [bookTags.tagId], references: [tags.id] }),
}));

export const authorTagsRelations = relations(authorTags, ({ one }) => ({
  author: one(authors, { fields: [authorTags.authorId], references: [authors.id] }),
  tag: one(tags, { fields: [authorTags.tagId], references: [tags.id] }),
}));

export const membersRelations = relations(members, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  book: one(books, { fields: [loans.bookId], references: [books.id] }),
  member: one(members, { fields: [loans.memberId], references: [members.id] }),
}));

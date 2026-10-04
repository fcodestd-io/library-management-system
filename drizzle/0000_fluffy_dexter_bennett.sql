CREATE TYPE "public"."copy_condition" AS ENUM('GOOD', 'DAMAGED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."copy_status" AS ENUM('AVAILABLE', 'BORROWED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."fine_reason" AS ENUM('OVERDUE', 'DAMAGE', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('UNPAID', 'PAID', 'WAIVED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."rack_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."member_type" AS ENUM('STUDENT', 'LECTURER', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('BORROWED', 'OVERDUE', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'QRIS', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('LOAN_FEE', 'FINE_PAYMENT');--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"inventory_number" varchar(50) NOT NULL,
	"rack_id" uuid NOT NULL,
	"condition" "copy_condition" NOT NULL,
	"status" "copy_status" NOT NULL,
	"acquired_at" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_copies_inventory_number_unique" UNIQUE("inventory_number")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"isbn" varchar(50),
	"book_value" numeric(10, 2) NOT NULL,
	"status" "book_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"remaining_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"reason" "fine_reason" NOT NULL,
	"status" "fine_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'STAFF' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "room_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "racks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "rack_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "racks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"member_type" "member_type" NOT NULL,
	"registered_at" date NOT NULL,
	"status" "member_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_member_code_unique" UNIQUE("member_code")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"book_copy_id" uuid NOT NULL,
	"processed_by" uuid NOT NULL,
	"returned_processed_by" uuid,
	"borrowed_at" timestamp NOT NULL,
	"due_at" timestamp NOT NULL,
	"returned_at" timestamp,
	"amount" numeric(10, 2) NOT NULL,
	"status" "loan_status" NOT NULL,
	"return_condition" "copy_condition",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"loan_id" uuid,
	"fine_id" uuid,
	"processed_by" uuid NOT NULL,
	"type" "payment_type" NOT NULL,
	"payment_method" "payment_method" DEFAULT 'CASH' NOT NULL,
	"amount_to_pay" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) NOT NULL,
	"applied_amount" numeric(12, 2) NOT NULL,
	"change_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_price_per_day" numeric(10, 2) NOT NULL,
	"maximum_loan_days" integer NOT NULL,
	"maximum_active_loans" integer NOT NULL,
	"daily_fine_rate" numeric(10, 2) NOT NULL,
	"damage_compensation_rate" numeric(5, 2) NOT NULL,
	"lost_book_compensation_rate" numeric(5, 2) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_rack_id_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racks" ADD CONSTRAINT "racks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_processed_by_users_id_fk" FOREIGN KEY ("returned_processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_fine_id_fines_id_fk" FOREIGN KEY ("fine_id") REFERENCES "public"."fines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
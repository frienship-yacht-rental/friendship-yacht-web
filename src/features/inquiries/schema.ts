import { z } from "zod";

/** Mirrors `modules/inquiries/schema.ts` in friendship-yacht-api. */
export const createInquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email address").max(254),
  phone: z.string().trim().max(40).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters")
    .max(2000),
  yachtSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const inquiryReceiptSchema = z.object({
  id: z.uuid(),
  receivedAt: z.iso.datetime(),
});

export type CreateInquiry = z.infer<typeof createInquirySchema>;
export type InquiryReceipt = z.infer<typeof inquiryReceiptSchema>;

"use server";

import type { ActionState } from "@/lib/actions/result";
import { runAction } from "@/lib/actions/run-action";
import { serverApi } from "@/lib/api/server";

import {
  createInquirySchema,
  type InquiryReceipt,
  inquiryReceiptSchema,
} from "./schema";

/**
 * Server Action for the enquiry form. The signature is what
 * `useActionState` expects; everything else is delegated so this file keeps
 * to the "only async function exports" rule of `"use server"` modules.
 */
export async function submitInquiry(
  _previous: ActionState<InquiryReceipt>,
  formData: FormData,
): Promise<ActionState<InquiryReceipt>> {
  return runAction(
    createInquirySchema,
    formData,
    (input) =>
      serverApi.post("/inquiries", {
        schema: inquiryReceiptSchema,
        body: input,
      }),
    { name: "submitInquiry" },
  );
}

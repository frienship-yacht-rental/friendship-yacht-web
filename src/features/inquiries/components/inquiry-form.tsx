"use client";

import { MailCheckIcon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/result";

import { submitInquiry } from "../actions";

function toFieldErrors(messages: string[] | undefined) {
  return messages?.map((message) => ({ message }));
}

export function InquiryForm({ yachtSlug }: { yachtSlug?: string | undefined }) {
  const [state, formAction, pending] = useActionState(
    submitInquiry,
    initialActionState,
  );

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "error" && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MailCheckIcon />
          </EmptyMedia>
          <EmptyTitle>Thank you — we have your enquiry</EmptyTitle>
          <EmptyDescription>
            We reply within one working day. Your reference is{" "}
            <code>{state.data.id}</code>.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <form action={formAction} noValidate>
      {yachtSlug ? (
        <input type="hidden" name="yachtSlug" value={yachtSlug} />
      ) : null}

      <FieldGroup>
        <Field data-invalid={fieldErrors?.name ? true : undefined}>
          <FieldLabel htmlFor="inquiry-name">Name</FieldLabel>
          <Input
            id="inquiry-name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={fieldErrors?.name ? true : undefined}
          />
          <FieldError errors={toFieldErrors(fieldErrors?.name)} />
        </Field>

        <Field data-invalid={fieldErrors?.email ? true : undefined}>
          <FieldLabel htmlFor="inquiry-email">Email</FieldLabel>
          <Input
            id="inquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={fieldErrors?.email ? true : undefined}
          />
          <FieldError errors={toFieldErrors(fieldErrors?.email)} />
        </Field>

        <Field data-invalid={fieldErrors?.phone ? true : undefined}>
          <FieldLabel htmlFor="inquiry-phone">Phone</FieldLabel>
          <Input
            id="inquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={fieldErrors?.phone ? true : undefined}
          />
          <FieldDescription>Optional.</FieldDescription>
          <FieldError errors={toFieldErrors(fieldErrors?.phone)} />
        </Field>

        <Field data-invalid={fieldErrors?.message ? true : undefined}>
          <FieldLabel htmlFor="inquiry-message">Message</FieldLabel>
          <Textarea
            id="inquiry-message"
            name="message"
            rows={5}
            required
            aria-invalid={fieldErrors?.message ? true : undefined}
          />
          <FieldError errors={toFieldErrors(fieldErrors?.message)} />
        </Field>

        <Field orientation="horizontal">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Sending…" : "Send enquiry"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

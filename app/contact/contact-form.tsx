"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { contactServices, serviceQueryValues, shouldMeasureInquiry, type ContactResult } from "../../lib/contact-contract";
import { captureAttribution } from "./attribution";
import { trackOpenAIAdsLeadCreated } from "../openai-ads";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const lastSubmission = useRef<{ fields: string; id: string } | null>(null);

  useEffect(() => {
    const service = serviceQueryValues[new URLSearchParams(window.location.search).get("service") || ""];
    const select = formRef.current?.elements.namedItem("service");
    if (service && select instanceof HTMLSelectElement) select.value = service;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const fields = Object.fromEntries(new FormData(form));
      const serialized = JSON.stringify(fields);
      if (!lastSubmission.current || lastSubmission.current.fields !== serialized) {
        lastSubmission.current = { fields: serialized, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ ...fields, submissionId: lastSubmission.current.id, attribution: captureAttribution() }),
      });
      const result = (await response.json()) as ContactResult;
      if (!response.ok || !result.ok) throw new Error(result.message || "We could not save your request. Please try again or email info@runexlogi.com.");

      form.reset();
      lastSubmission.current = null;
      if (shouldMeasureInquiry(result)) trackOpenAIAdsLeadCreated();
      setStatus("success");
      setMessage(result.accepted && result.receiptId
        ? `Thank you. Your request has been saved for the Runex team. Reference: ${result.receiptId}.${result.notification === "pending" ? " Email notification is pending; you do not need to submit again." : ""}`
        : "Thank you. Your request has been received.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && error.name === "AbortError"
        ? "We could not confirm your request yet. Please try again with the same details; your submission reference will be reused. You can also email info@runexlogi.com."
        : error instanceof Error ? error.message : "We could not save your request. Please email info@runexlogi.com.");
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
      setStatus((current) => current === "submitting" ? "error" : current);
    }
  }

  return (
    <form ref={formRef} className="contact-form" onSubmit={handleSubmit} aria-busy={status === "submitting"}>
      <div className="contact-form-grid">
        <label>
          <span>Name *</span>
          <input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
        <label>
          <span>Company</span>
          <input name="company" type="text" autoComplete="organization" maxLength={120} />
        </label>
        <label>
          <span>Email *</span>
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={50} />
        </label>
        <label className="contact-form-wide">
          <span>Service needed *</span>
          <select name="service" defaultValue="" required>
            <option value="" disabled>Select a service</option>
            {contactServices.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
        </label>
        <label className="contact-form-wide">
          <span>Tell us about the freight and requirements *</span>
          <textarea name="details" placeholder="Include origin and destination, pallet/carton or unit count, dimensions, required work and target dates. Estimates are welcome." rows={7} minLength={20} maxLength={3000} required />
        </label>
        <label className="contact-honeypot" aria-hidden="true">
          <span>Website</span>
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="button button-primary contact-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send quote request"}
      </button>
      {message && (
        <p className={`contact-form-status ${status === "success" ? "is-success" : "is-error"}`} role="status">
          {message}
        </p>
      )}
      <p className="contact-form-note">We save your inquiry and limited page/source context to respond, recover notification failures and understand which services people need. Please avoid sensitive personal information. <a href="/privacy-policy#website-inquiries">How we handle inquiries</a>.</p>
    </form>
  );
}

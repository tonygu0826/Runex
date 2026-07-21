"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const services = [
  "Warehousing and storage",
  "E-commerce fulfillment",
  "FBA preparation",
  "Cross-docking",
  "Transportation",
  "Other logistics support",
];

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "We could not send your request.");
      }

      form.reset();
      setStatus("success");
      setMessage("Thank you. Your request has been sent to the Runex team.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not send your request. Please email info@runexlogi.com.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
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
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
        </label>
        <label className="contact-form-wide">
          <span>Tell us about the freight and requirements *</span>
          <textarea name="details" rows={7} minLength={20} maxLength={3000} required />
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
      <p className="contact-form-note">Your information is used only to respond to this request.</p>
    </form>
  );
}

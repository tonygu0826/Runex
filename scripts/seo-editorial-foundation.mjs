// Reviewed general operating principles. The model may derive conditional
// recommendations from these; it may not create external facts or Runex claims.
// A separate semantic review checks every derived recommendation and question.
export const editorialFoundation = [
  { id: "entity-identity", guidance: "Records should distinguish the physical item, package, shipment, order and business reference being identified; one identifier should not silently stand for a different entity." },
  { id: "reference-context", guidance: "An identifier should retain the business context needed to interpret it, such as its owner, sender or original source; matching text alone does not establish that two records describe the same entity." },
  { id: "quantity-basis", guidance: "A quantity should state its unit, scope and observation boundary; totals should reconcile to the underlying observations without counting the same physical units twice." },
  { id: "physical-record-alignment", guidance: "Physical handling and record changes should remain distinguishable and traceable to one another; correcting a record is not evidence that a second physical movement occurred." },
  { id: "instruction-scope", guidance: "A working instruction should identify the task, affected units, required inputs and completion criteria; an instruction for one scope should not be assumed to authorise unrelated work." },
  { id: "instruction-revisions", guidance: "Revised instructions should identify the version and transition boundary; work already completed and work still open should be considered separately before a revision is applied." },
  { id: "partial-completion", guidance: "Partially completed work should distinguish completed quantities or steps from the balance still outstanding; a parent record should not imply that every child task is complete." },
  { id: "event-order", guidance: "Operational events should preserve their observed time and recording time; received sequence alone does not prove physical sequence or justify replacing a later verified event." },
  { id: "evidence-provenance", guidance: "An operational observation should retain its originating record and the conditions under which it was captured; an explanation or correction should remain distinguishable from that observation." },
  { id: "exception-resolution", guidance: "An unresolved discrepancy should identify the exact information or instruction still needed; the eventual resolution should remain linked to the discrepancy rather than erase its history." },
  { id: "handover-continuity", guidance: "A handover should state what was completed, what remains, the relevant references and the next responsible party; the receiving party should confirm the condition of the work it receives." },
  { id: "permissions-boundaries", guidance: "An approval should state the action and scope permitted; an extension beyond the approved quantity, time or task boundary requires a further recorded decision." },
  { id: "interface-contracts", guidance: "A data exchange should define field meanings, units, version or batch boundaries and the treatment of omitted values; successful transmission should be distinguished from accepted business processing." },
  { id: "retry-continuity", guidance: "A retry should preserve the identity of the original business request and distinguish work already accepted from work still pending; a retry should not silently create another physical task." },
  { id: "reporting-boundaries", guidance: "A report or metric should identify its observation window, included scope and calculation basis; comparisons should use compatible definitions rather than matching column names alone." },
  { id: "commercial-traceability", guidance: "A commercial line should be traceable to its agreed task, quantity basis and rate reference; a financial correction should remain distinguishable from a correction to operational stock." },
  { id: "material-configuration", guidance: "Packaging or task materials should be identified by their required function and specified configuration; similar appearance does not establish permission to substitute one material for another." },
  { id: "availability-qualifications", guidance: "An availability statement should distinguish known, unconfirmed, committed and physically observed quantities or conditions; missing confirmation should not be converted into an assumed positive result." },
  { id: "client-ownership", guidance: "Client ownership and access should remain distinguishable from physical product identity and location; changing a contact or shared work assignment does not itself transfer stock ownership." },
  { id: "hypothetical-examples", guidance: "Worked examples should be explicitly hypothetical and preserve their assumptions; they are illustrations of a decision process, not customer results, facility capabilities or universal service promises." },
];

# KAVACH thesis comparison

Reviewed on 17 November 2026. All page references below are physical PDF page numbers, not the Roman/Arabic numbers printed within the documents.

Reference: `C:/Users/acer/Downloads/Opportunity-Engine-Thesis.pdf` (56 pages).

Current report: `C:/Users/acer/Desktop/UserLoginProject/output/pdf/KAVACH_MCA_Report.pdf` (54 pages).

## Assessment

KAVACH has broader diagram coverage and explicit explanations of its deterministic detector, risk score, fallback behavior, and tool-policy limitations. The reference is more complete as a presentation of a running project: it separates background, implementation layers, API, database, deployment, and observed results, and includes interface captures. KAVACH remains a detailed implementation/design draft with incomplete execution evidence.

The reference is a peer thesis, not an official submission checklist. Its reported operational figures were read as document claims and were not independently verified. No claims about department acceptance or project correctness follow from matching it.

## Comparison

| Area | Reference thesis | KAVACH report | Finding |
|---|---|---|---|
| Institutional format | Cover, title page, dedication, optional quotation page, approval, declaration, certificate, acknowledgement, figure/table lists, abstract, contents | Same broad institutional pattern, without the quotation page | Broadly aligned. A quotation page is not a demonstrated requirement. |
| Organization | 10 main chapters, including background, API, web client, database, deployment, results | 6 main chapters; implementation topics are grouped together | More chapters are not inherently better. Add missing substance before changing numbering. |
| Background and related work | Dedicated Chapter 2, PDF pp. 18–19 | No dedicated background/related-work discussion | Add a focused discussion of authentication monitoring, rule-based detection, user risk, and LLM-assisted investigation, supported by appropriate sources. |
| Architecture and diagrams | 11 figures: architecture, DFD 0/1/2, sequence, activity, use cases, 3 interface captures, and database schema | 15 figures, including 12 detailed Chapter 3 views: C4 1/2/3, UML components, two sequences, ER, use cases, DFD 0/1, and two DFD 2 views | KAVACH already covers the requested structural diagrams. It lacks a dedicated UML activity diagram with explicit decision branches. |
| Diagrams' presentation | Compact diagrams integrated with surrounding explanation | Mostly dedicated diagram pages, physical pp. 22–33 | KAVACH provides more detail but some entity/sequence labels are small at normal page scale. Reduce text inside nodes and move long field explanations to tables. |
| API documentation | Endpoint/method/purpose tables, physical pp. 36–37; quick reference p. 54 | API responsibilities and security described, without a comparable endpoint catalog | Add method, route, access scope, input fields, response, and principal errors, checked against controllers. |
| LLM explanation | Agent organization and rule/policy chapters, pp. 29–34 | Two-loop flow, registered tools, dedicated analysis, fallback and limitations, principally pp. 39–41 | Explain the LLM-specific contribution with sanitized prompt/context examples, response schema, output validation, selected model configuration, and one complete example. Separate deterministic detection from generated interpretation. |
| UI evidence | Three captures, pp. 40–41. The two admin captures are explicitly preview/sample views | Source-derived interface descriptions, pp. 42–46; no runtime screenshots | Add actual application captures. If a capture uses synthetic data or offline preview, label it clearly. A mockup is not evidence that a backend action ran. |
| Database documentation | Dedicated chapter, pp. 42–46, with table overview, schema, fields, constraints, indexes and security | Detailed entity view p. 28 and constraints/time discussion p. 34, plus service explanations | Add a data dictionary for important fields, uniqueness/nullability, relationship behavior, and indexes. A separate chapter is optional. |
| Deployment and operations | Host topology, environment roles, health checks, operational behavior and failure handling, pp. 22 and 47–48 | Development topology and configuration assumptions; no documented deployment run | Add a reproducible local setup and startup guide, configuration variable names without values, ports, database preparation, and smoke checks. Describe production deployment only if performed. |
| Results | Recorded snapshot and operating incidents, pp. 49–50 | Proposed test plan and evaluation plan, pp. 44–46 | KAVACH has expected results, not executed results. Run the scenarios and record actual outputs/statuses before adding a Results and Discussion section. |
| References | 11 entries, mostly technology documentation, p. 51 | 5 entries, including local source/template and 3 external technical sources, p. 50 | Expand relevant citations and connect them to claims. Entry count alone is not a quality measure. Both reports would benefit from stronger research grounding. |
| Finalization | Conventional declaration/certificate wording and separate publication/biography appendices | Draft-review reminders and report-build appendix | KAVACH needs editorial cleanup before submission. Candidate/faculty information is already filled; remaining issues concern wording and evidence. |

## Priorities before submission

### 1. Complete front-matter wording and remove editing reminders

KAVACH physical p. 5 says the declaration is to be reviewed and signed; p. 6 says the work is presented for certification and approval is subject to review/signature. These are draft instructions rather than the reference's conventional declaration/certificate text. Use institution-approved wording after candidate/supervisor review, leaving real signatures and dates to the appropriate people. Do not represent unsigned approval as already granted.

Physical pp. 53–54 contain report-source layout, compilation commands, completion reminders, and discussion of how the report was assembled. Move editor/build instructions to the source README unless the department specifically requests them in the submitted thesis. Keep technically useful reproducibility material about running KAVACH, rather than about compiling this document.

### 2. Add application evidence

Capture login, dashboard, anomaly list/detail, risk view, telemetry, directory status changes, audit, and AI execution trace from the running application. Provide captions stating the scenario, role, data mode, and observed behavior. Ensure synthetic login events are identifiable and exclude credentials/tokens and unnecessary personal data from screenshots.

### 3. Execute and report validation

Keep the existing proposed cases, but add environment, inputs, expected behavior, observed behavior, pass/fail, and evidence. Prioritize known-user failure persistence, fifth qualifying failure, new-IP/device baselines, risk boundaries, inactive-account JWT rejection, ownership checks, tool-path authorization, and fallback behavior. Record failures honestly rather than turning expected behavior into a claimed result.

A small repeatable dataset and one end-to-end incident walkthrough would be more persuasive than additional overview diagrams. Any latency/accuracy metrics require an actual measurement method and recorded runs.

### 4. Explain why an LLM is used

The title emphasizes an LLM, while six deterministic rules generate the anomalies and weights. Explain the distinction explicitly. Show the same case as raw telemetry, deterministic rule output, contextual risk, and generated advisory output. Document sanitization, response validation, fallback behavior, and the boundary between an advisory recommendation and an operational tool action. Describe possible hallucinations and authorization failures without claiming they have been solved where they have not.

### 5. Add targeted background, API, data, and operating documentation

Add related work and a gap statement; a compact endpoint table; a data dictionary; and setup/run instructions. These can be sections within the existing structure. If reorganizing, a useful sequence is: Introduction; Background and Related Work; Requirements; System Design; Implementation and LLM Integration; Testing and Results; Deployment/Operations; Conclusion and Future Work.

### 6. Refine rather than expand diagram volume

Retain the detailed views requested by the candidate. An activity diagram can show login/authentication branching or the investigation/containment decision flow. Use C4 views for structural scope, UML for component/interaction/decision notation, and DFDs strictly for named data flows. Review DFD balancing and notation, split compound data-store symbols when needed, and check that parent/child process boundaries expose the same necessary inputs and outputs. Larger labels and fewer words inside boxes would improve printed readability.

## Useful qualities already present in KAVACH

- Exact detection thresholds and weights, rather than a vague claim of machine learning.
- The 24-hour capped risk equation and worked example.
- Explicit distinction between application roles and agent-role labels.
- Accurate limitations about request-local steering, sequential tools, timestamps, fallback, and audit integrity.
- Source traceability and an editable LaTeX diagram set.
- A dedicated conclusion and future-work chapter, which is not a separate main chapter in the reference.

These strengths should be kept. Consolidate repeated draft/process disclaimers into a clear methodology/limitations discussion without changing the truth of the report.

## Interpretation of the reference's evidence

Its screenshots include labelled preview/sample admin views. Its Results and Discussion chapter reports an operational snapshot, notes, incidents, and a cache-hit check; it explicitly does not establish sustained cache hit rate, response-time benchmarks, or classification accuracy. KAVACH should adopt that transparency while producing its own evidence, not copy another project's numbers, deployment claims, screenshots, bibliography wholesale, or biography.

No edits to either thesis were made as part of this comparison.

# KAVACH MCA report

Main document: `Final_Thesis.tex`. Uses the supplied NIT Agartala class, logos, and chapter style, adapted for MCA.

Chapter 3 includes twelve detailed colored vector diagrams: C4 context/container/backend components; UML component architecture; login and AI sequences; entity relationships; UML use cases; DFD 0, DFD 1, and DFD 2 for detection and AI. Edit individual `.tex` files in `diagrams/`, shared colors in `Final_Thesis.tex`, and styles in `diagrams/styles.tex`. The Chapter 1 overview uses the same palette. Redundant agent-flow/navigation diagrams and repeated narrative were removed in the condensed edition.

The condensed report has 53 total PDF pages, within the requested 50–55-page range. It retains all twelve detailed Chapter 3 diagrams, six original screenshots, detection rules/weights, risk equation, thirteen-tool catalog, validation scenarios, database dictionary, API catalog, five appendices, and the confirmed biography. Main body typography and institutional page geometry are preserved; concise prose and local table formatting reduce the length.

Confirmed details are stored in `metadata.tex`: Umakant Yadav (24MCA026), supervisor Dr. Ranjita Das (Assistant Professor), and HOD Dr. Ashim Saha (Associate Professor). The report title is "KAVACH: User Login Analysis Using LLM". Edit that file for future changes to these details or the submission date.

The material after References is organized as Appendix A (Project Structure), B (Database Tables), C (API Quick Reference), D (Publications Related to the Work), and E (Biographical Sketch). Edit the corresponding files in `appendices/`; `appendix.tex` includes them. The data dictionary documents JPA types and declared mappings, and the API catalog reflects source declarations rather than executed permission tests. The biography contains confirmed project/academic details only. The publication section states that no related publications have been reported.

## Report build and editing notes

The institutional class and logos come from the supplied template. `Final_Thesis.tex` restores modern float handling after loading the legacy class. Front matter is adapted for MCA; template-only internship pages and sample authors/biographies are excluded. The embedded bibliography does not use the sample `.bib` file.

The document sources are `Final_Thesis.tex`, `metadata.tex`, `chapter1.tex` through `chapter6.tex`, `appendix.tex`, `appendices/`, `diagrams/`, the class/styles, and `images/`. `build.ps1` runs the selected compiler. Before submission, review institutional wording, confirm the date, and obtain the required real signatures. Compilation commands and these editor reminders are kept here rather than in a thesis appendix.

Build with `tectonic Final_Thesis.tex`, or run `pdflatex -interaction=nonstopmode -halt-on-error Final_Thesis.tex` three times. No BibTeX step is needed. Initial Tectonic builds require network access for packages; a complete TeX Live installation can compile offline.

The validation scenarios are proposed tests, not application test results. Chapter 5 contains six candidate-provided website screenshots received on 17 November 2026: sign-in, administrator dashboard, user anomalies, login telemetry, personal risk, and the initial AI console. Their original pixels are preserved in `images/screenshot-*.png`; `screenshots.tex` controls the figures and captions. The duplicate administrator-risk view and the directory view were omitted to prioritize the core login-analysis and AI workflows. Screenshots illustrate interface states and do not establish benchmark results or successful execution of an unshown action.

Original template class/style/logo files and README are retained. Files beginning `original_` are unmodified template examples, not part of the build. The sample bibliography is unused; references are embedded in the main document.

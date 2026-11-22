# KAVACH MCA report

Main document: `Final_Thesis.tex`. Uses the supplied NIT Agartala class, logos, and chapter style, adapted for MCA.

Chapter 3 includes twelve detailed colored vector diagrams: C4 context/container/backend components; UML component architecture; login and AI sequences; entity relationships; UML use cases; DFD 0, DFD 1, and DFD 2 for detection and AI. Edit individual `.tex` files in `diagrams/`, shared colors in `Final_Thesis.tex`, and styles in `diagrams/styles.tex`. The existing overview, agent-flow, and navigation diagrams also use the color palette.

Confirmed details are stored in `metadata.tex`: Umakant Yadav (24MCA026), supervisor Dr. Ranjita Das (Assistant Professor), and HOD Dr. Ashim Saha (Associate Professor). The report title is "KAVACH: User Login Analysis Using LLM". Edit that file for future changes to these details or the submission date.

The material after References is organized as Appendix A (Project Structure), B (Database Tables), C (API Quick Reference), D (Publications Related to the Work), and E (Biographical Sketch). Edit the corresponding files in `appendices/`; `appendix.tex` includes them. The data dictionary documents JPA types and declared mappings, and the API catalog reflects source declarations rather than executed permission tests. The biography contains confirmed project/academic details only. The publication section states that no related publications have been reported.

## Report build and editing notes

The institutional class and logos come from the supplied template. `Final_Thesis.tex` restores modern float handling after loading the legacy class. Front matter is adapted for MCA; template-only internship pages and sample authors/biographies are excluded. The embedded bibliography does not use the sample `.bib` file.

The document sources are `Final_Thesis.tex`, `metadata.tex`, `chapter1.tex` through `chapter6.tex`, `appendix.tex`, `appendices/`, `diagrams/`, the class/styles, and `images/`. `build.ps1` runs the selected compiler. Before submission, review institutional wording, confirm the date, and obtain the required real signatures. Compilation commands and these editor reminders are kept here rather than in a thesis appendix.

Build with `tectonic Final_Thesis.tex`, or run `pdflatex -interaction=nonstopmode -halt-on-error Final_Thesis.tex` three times. No BibTeX step is needed. Initial Tectonic builds require network access for packages; a complete TeX Live installation can compile offline.

The validation scenarios are proposed tests, not application test results. Screenshots and benchmarks were not invented. Add genuine application captures to Chapter 5 if required.

Original template class/style/logo files and README are retained. Files beginning `original_` are unmodified template examples, not part of the build. The sample bibliography is unused; references are embedded in the main document.

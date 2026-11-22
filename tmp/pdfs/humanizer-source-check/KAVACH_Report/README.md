# KAVACH MCA report

The main document is `Final_Thesis.tex`. It uses the supplied NIT Agartala class, logos, and chapter style, adapted for MCA.

Chapter 3 has twelve colored vector diagrams: C4 context, containers, and backend components; UML component architecture; login and AI sequences; entity relationships; use cases; DFD 0 and DFD 1; and DFD 2 for detection and AI. Individual diagrams are editable `.tex` files in `diagrams/`. Colors are defined in `Final_Thesis.tex` and shared styles in `diagrams/styles.tex`. The Chapter 1 overview uses the same palette. The condensed edition removes duplicate agent-flow and navigation diagrams and repeated prose.

The report has 53 total PDF pages, within the requested range of 50 to 55. It retains the twelve detailed diagrams, six original screenshots, detection rules and weights, risk equation, thirteen-tool catalog, validation scenarios, database dictionary, API catalog, five appendices, and confirmed biography. Body typography and institutional page geometry are unchanged. Concise prose and local table formatting keep the report within the page limit.

`metadata.tex` contains the confirmed details: Umakant Yadav (24MCA026), supervisor Dr. Ranjita Das (Assistant Professor), and HOD Dr. Ashim Saha (Associate Professor). The title is "KAVACH: User Login Analysis Using LLM". Future changes to these details or the submission date belong in that file.

After References, Appendix A covers project structure, B database tables, C the API reference, D publications, and E the biographical sketch. Their files are in `appendices/`, included by `appendix.tex`. The data dictionary lists JPA types and declared mappings. API scopes follow source declarations and have not been verified by executed permission tests. The biography uses confirmed academic and project details. No related publications have been reported.

## Report build and editing notes

The class and logos come from the supplied institutional template. `Final_Thesis.tex` restores modern float handling after loading its legacy class. The front matter uses MCA details and excludes the template's internship pages and sample authors and biographies. References are embedded in the main document; the sample `.bib` file is unused.

The sources are `Final_Thesis.tex`, `metadata.tex`, `chapter1.tex` through `chapter6.tex`, `appendix.tex`, `appendices/`, `diagrams/`, the class and style files, and `images/`. `build.ps1` runs the selected compiler. Before submission, review the institutional wording, confirm the date, and obtain the required signatures. This README contains build commands and editing reminders.

Build with `tectonic Final_Thesis.tex`, or run `pdflatex -interaction=nonstopmode -halt-on-error Final_Thesis.tex` three times. No BibTeX step is needed. Initial Tectonic builds require network access for packages; a complete TeX Live installation can compile offline.

The validation scenarios await execution. Chapter 5 includes six website screenshots supplied by the candidate on 17 November 2026: sign-in, administrator dashboard, user anomalies, login telemetry, personal risk, and the initial AI console. `images/screenshot-*.png` preserves the original pixels, and `screenshots.tex` controls their placement and captions. The duplicate administrator-risk and directory views were omitted to keep the focus on login analysis and AI investigation. These captures show interface states without proving benchmark results or the outcome of an action that is not shown.

The original template class, styles, logos, and README are retained. Files beginning `original_` are unmodified template examples outside the active build.

The report prose was reviewed using the [Humanizer skill](https://github.com/blader/humanizer/blob/main/SKILL.md). The pass covered all six chapters, five appendices, front matter, diagram explanations, captions, and this README. Technical tables, code, identifiers, citations, and confirmed personal details were preserved.

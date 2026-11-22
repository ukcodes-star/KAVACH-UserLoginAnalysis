from pathlib import Path
import re
import shutil

root = Path(__file__).resolve().parents[2]
source = root / 'output/pdf/KAVACH_Report'
backup = root / 'tmp/pdfs/pre-compaction'
backup.mkdir(exist_ok=True)
for name in ['KAVACH_MCA_Report.pdf', 'KAVACH_MCA_LaTeX_Source.zip']:
    shutil.copy2(root / 'output/pdf' / name, backup / name)

(source / 'chapter2.tex').write_text(r'''\chapter{Requirement Analysis}
\section{Software Requirements}
Table~\ref{tab:stack} records the dependencies declared in the repository. Java 21, a compatible Node.js environment, and PostgreSQL are required for development. Live inference additionally requires provider configuration and network access.
\begin{table}[htbp]\centering\small\caption{Declared software stack.}\label{tab:stack}
\begin{tabularx}{\textwidth}{lY}\toprule Component & Declaration or purpose\\\midrule
Java & Version 21 in Maven properties.\\
Spring Boot & Parent 4.1.1; MVC, validation, JPA, and security starters.\\
PostgreSQL & JDBC driver and relational persistence.\\
JWT & JJWT API, implementation, and Jackson modules 0.12.6.\\
AI client & OpenAI Java SDK 4.101.0 for Grok integration.\\
React & React and React DOM \code{^19.3.1}.\\
Vite & Build dependency \code{^8.3.6}.\\
Presentation & Tailwind CSS \code{^3.4.17}, Recharts, Lucide React, GSAP.\\
HTTP / routing & Axios and React Router DOM.\\\bottomrule\end{tabularx}\end{table}

The backend provides Maven wrapper scripts. Frontend scripts support development, build, preview, and linting. Vite listens on port 5173 and proxies \code{/api} to \code{http://localhost:8080}; Axios also supports a configurable API base URL.

\clearpage\section{Functional Requirements}
\begin{enumerate}
\item Validate registration, reject duplicate usernames/emails, hash passwords, authenticate active accounts, and return JWTs with safe user details.
\item Record known-account login outcomes and permit administrator-created demonstration events with account, timestamp, status, IP, device, and location fields.
\item Evaluate six independent rules, preserve each triggered anomaly, and check the user/type/event combination before inserting a duplicate.
\item Aggregate recent anomalies into a capped 24-hour risk score and expose severity totals, login outcomes, a seven-day trend, and a ten-account watchlist.
\item Provide role-aware account, telemetry, anomaly, audit, and AI views; apply ownership checks to selected personal resources.
\item Support advisory explanations, analysis history, bounded tool calling, and deterministic fallback when live inference is unavailable.
\end{enumerate}

\section{Quality and Operating Requirements}
Protected requests require authentication, with role and resource checks at sensitive entry points. Tool execution needs equivalent action-level policy. Alerts must retain understandable reasons and fixed weights, while controllers, services, repositories, DTOs, and pages keep responsibilities separate.

Reliability requires validation of failed-login transaction behavior, duplicate handling, and telemetry failures. Performance testing must cover history queries, pagination, and multi-cycle AI requests. Screenshots illustrate the UI; load capacity and detection accuracy require separate measurement.

Configuration values should remain outside report examples. Timestamp rules use \code{LocalDateTime} and need a consistent time convention. Synthetic events must remain distinguishable from real login evidence. Hardware minimums and calibrated attack probabilities have not been established.
''', encoding='utf-8')

(source / 'chapter3.tex').write_text(r'''\chapter{Design Analysis}
\section{Layered Design and Access Boundaries}
Controllers receive validated HTTP inputs, services coordinate business operations, and JPA repositories access entities and aggregate queries. DTOs define API contracts. React pages share authentication/theme state and an Axios client \cite{repo}.

The security chain permits authentication routes and protects other requests. The JWT filter validates tokens, resolves the current account, rejects inactive users, and installs its role. Method security and selected ownership checks restrict resources \cite{spring}. Registry tools form a separate service entry path and require equivalent policy.

The API client uses JSON, bearer credentials, and a 30-second timeout; unauthorized responses clear stored session state. Multi-cycle agent requests require coordinated timeout, cancellation, and retry behavior. Appendix C summarizes direct endpoint scopes.

\input{diagrams/design-views}
''', encoding='utf-8')

p = source / 'diagrams/design-views.tex'
s = p.read_text()
s = s[:s.index('\\clearpage\\section{Database Constraints and Time Semantics}')]
s = s.replace('% Each diagram has a dedicated page with a consistent readable vector layout.', '% Each detailed diagram retains its dedicated vector page.')
p.write_text(s, encoding='utf-8')

p = source / 'chapter4.tex'
s = p.read_text()
start = s.index('\\begin{figure}', s.index('\\section{Two-Loop AI Orchestration}'))
end = s.index('\\end{figure}', start) + len('\\end{figure}')
s = s[:start] + s[end:]
p.write_text(s, encoding='utf-8')

p = source / 'chapter5.tex'
s = p.read_text()
table_start = s.index('\\begingroup', s.index('\\clearpage\\section{Validation Status}'))
table_end = s.index('\\endgroup', table_start) + len('\\endgroup')
tests = s[table_start:table_end].replace('\\begingroup\\small\\setstretch{1.1}', '\\begingroup\\footnotesize\\setstretch{1.0}\\renewcommand{\\arraystretch}{1.1}')
intro = r'''\chapter{Interfaces and Validation}
\section{Interface Overview}
The React application provides authenticated pages for anomalies, risk, login logs, and AI investigation. Administrator navigation additionally exposes the global dashboard, directory, and audit views. Backend authorization remains authoritative.

Login and registration operate outside the protected layout. Authentication context retains the token and safe user data in local storage; the shared client attaches the bearer token and clears session state after relevant unauthorized responses. Directory controls change account state, while the audit view and browser console serve separate security-record and diagnostic purposes.

Anomaly filters expose rule type, severity, and event context. Risk summarizes the preceding 24 hours; login views expose underlying records and administrator-created demonstration events. The AI workspace selects investigator, operator, or collaborative behavior and submits prompt, context, steering, and follow-up arrays. Its trace displays returned tool outcomes.

\input{screenshots}

\clearpage\section{Validation Plan}
The candidate's screenshots document visible interface states. The repository includes a context-loading test, but no controlled rule-test or load-test results were supplied. Table~\ref{tab:tests} lists expected outcomes to verify, not recorded passes.
'''
tail = r'''
\noindent\textbf{Boundary coverage.} Verify cross-account access, administrative operations through direct and tool paths, invalid arguments, malformed model output, provider failures, concurrent inserts, and backdated events.

\noindent\textbf{Evaluation.} Use labelled ordinary and suspicious events to measure precision/recall per rule. Record hardware, data volume, concurrency, latency, and actual live/fallback mode. Keep deterministic and model-assisted measurements separate.
'''
p.write_text(intro + tests + '\n' + tail, encoding='utf-8')

(source / 'chapter6.tex').write_text(r'''\chapter{Conclusion and Future Work}
\section{Conclusion}
KAVACH combines authenticated login telemetry, six transparent detection rules, a capped 24-hour risk score, security views, audit records, and LLM-assisted investigation. Its two-loop service connects prompts to thirteen application tools and supports deterministic fallback. The repository and screenshots demonstrate implementation and interface design; empirical detection accuracy and production performance remain to be measured.

\section{Limitations}
Fixed schedules and string-based IP/device baselines do not establish compromise. Weights are uncalibrated, the brute-force query lacks an explicit upper time bound, and duplicate checks require concurrency testing. Steering is request-local, tools execute sequentially, and operational tools need consistent authorization. Audit persistence alone does not establish tamper resistance.

\section{Future Work}
Priorities are centralized tool policy, reliable event-time handling, database constraints, and rule-specific integration tests. Further work should add authenticated agent sessions with cancellation/live steering, protected audit retention, bounded queries, and measured concurrency. A labelled evaluation corpus should guide threshold calibration before learned anomaly models, external SIEM integration, or additional authentication factors are introduced.
''', encoding='utf-8')

p = source / 'appendices/project-structure.tex'
s = p.read_text()
s = s[:s.index('\\clearpage\\section{Principal Implementation Modules}')]
s += r'''
The backend entry point is \code{LoginAnalysisBackendApplication.java}. Authentication, telemetry/detection, risk, and AI orchestration are implemented by \code{AuthService}, \code{LoginLogService}, \code{RiskService}, and \code{TwoLoopAgentService}, respectively. Their supporting packages are shown above.
'''
p.write_text(s, encoding='utf-8')

p = source / 'appendices/api-reference.tex'
s = p.read_text()
s = s[:s.index('\\subsection{Agent Request Contract}')]
s += r'''
\noindent\textbf{Agent input.} A nonblank prompt is required. Optional context, role, steering, and follow-up arrays form one request; roles are investigator, operator, or collaborative. The response contains final text, execution steps, tool names, loop counts, model/mode, and completion time.

\noindent\textbf{HTTP outcomes.} Reads/analysis normally return 200; declared creation routes use 201 and deletion 204. Principal errors are 400 (input), 401 (credentials/token), 403 (access), 404 (resource), and 409 (duplicate registration). Operational tools can change data during fallback planning as well as live inference.
'''
p.write_text(s, encoding='utf-8')

p = source / 'Final_Thesis.tex'
s = p.read_text().replace('Source map in Appendix A.', 'Project structure in Appendix A.')
p.write_text(s, encoding='utf-8')
print('Removed repeated narrative, two redundant overview diagrams, and duplicate appendix details. Preserved 12 detailed diagrams, six screenshots, rules, risk formula, tools, API/data dictionaries, and biography.')

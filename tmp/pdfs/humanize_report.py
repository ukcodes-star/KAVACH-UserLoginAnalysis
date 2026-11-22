from pathlib import Path
import re, json
from collections import Counter

root = Path(__file__).resolve().parents[2]
source = root / 'output/pdf/KAVACH_Report'
before = root / 'tmp/pdfs/pre-humanizer/KAVACH_Report'
changes = {}

def revise(name, pairs):
    path = source / name
    text = path.read_text(encoding='utf-8')
    count = 0
    for prefix, replacement in pairs:
        # Match one prose paragraph, leaving TeX environments and adjacent paragraphs intact.
        lines = text.splitlines()
        matches = [i for i, line in enumerate(lines) if line.startswith(prefix)]
        assert len(matches) == 1, (name, prefix, matches)
        lines[matches[0]] = replacement
        text = '\n'.join(lines) + '\n'
        count += 1
    path.write_text(text, encoding='utf-8')
    changes[name] = count

revise('Final_Thesis.tex', [
 ('My project supervisor,', r'To my project supervisor, \SupervisorName, \SupervisorDesignation, CSED, NIT Agartala, for guidance, insight, encouragement, and trust throughout this project. I also thank the faculty members of the department for their teaching and support in my professional growth. I dedicate this work to everyone who helped develop the project and supported me along the way.'),
 ('I declare that the work', r'I declare that this report, ``\ReportTitle'', submitted to the Department of Computer Science and Engineering, National Institute of Technology, Agartala, for the \DegreeName\ degree, presents my work. I have acknowledged the sources used in preparing it. I understand my responsibility to uphold academic honesty and integrity, including the prohibition on fabricating results, data, or references.'),
 ('This declaration is to be', 'The candidate must review and sign this declaration before submission.'),
 ('Certification and approval', 'Certification and approval require review and signatures from the supervisor and the department.'),
 ('I express my gratitude', r'I thank my project supervisor, \SupervisorName, \SupervisorDesignation, for guidance, feedback, and encouragement during the development of KAVACH. I am grateful to \HodName, \HodDesignation\ and Head of the Department, and to the faculty of the Department of Computer Science and Engineering, National Institute of Technology Agartala, for their academic support.'),
 ('I acknowledge the developers', 'The developers and maintainers of Spring Boot, Spring Security, React, PostgreSQL, and the supporting open-source libraries made this project possible. Their software provided a foundation for studying authentication monitoring, rule-based anomaly detection, and security analysis with application tools. I also thank my family and friends for their patience and support.'),
 ('KAVACH is a web application', 'KAVACH monitors login activity and applies explicit rules to identify unusual events. It provides an AI tool interface for investigating those events. A React frontend communicates with a Java 21 Spring Boot backend, which stores data in PostgreSQL through Spring Data JPA. BCrypt verifies passwords, and bearer JSON Web Tokens authenticate later requests. Role and ownership checks protect administrative operations and selected account resources.'),
 ('The detection pipeline evaluates', 'The detector checks six conditions: a failed login, a login at an unusual hour, an inactive account, an unseen IP address, an unseen device string, and repeated failures within a ten-minute window. Each matching rule assigns a fixed severity and weight. The user risk score sums anomaly weights from the preceding 24 hours and caps the result at 100. The dashboard presents login statistics, severity totals, recent critical anomalies, and a ranked account watchlist.'),
 ('The AI component includes', 'The AI service produces structured anomaly explanations and runs a two-loop workflow. The inner loop executes bounded model or planner cycles and application tools; the outer loop processes follow-ups supplied with the request. Thirteen registered tools provide investigative queries and selected account or telemetry operations. A deterministic fallback handles requests when live inference is unavailable. This report describes the implementation, data flows, detection rules, and a reproducible validation plan. Accuracy, throughput, and production readiness have not been measured; proposed improvements are identified separately from implemented behavior.'),
])

revise('chapter1.tex', [
 ('Authentication records are', 'Login records help investigators examine account misuse. Each record identifies an account, an outcome, a time, and network or client details. A single event provides limited context. Comparing it with account state and earlier activity can explain why it deserves attention.'),
 ('KAVACH combines', r'KAVACH brings login records, rule-based alerts, account risk, audit history, and AI-assisted investigation into one web application. Its name means a shield. The application has a Spring Boot REST backend, a React frontend, and PostgreSQL storage. The implementation described here is the supplied source snapshot \cite{repo}.'),
 ('The application supports', 'ADMIN and USER are the application security roles. Administrators can inspect activity across accounts and manage users through designated endpoints. Ordinary users have selected views of their own activity. The AI investigator and operator roles describe agent behavior; they do not replace the signed-in user\'s permissions.'),
 ('A basic login implementation', 'Rejecting an incorrect password resolves an immediate access request but leaves questions for an investigator. Which account was targeted? Were there repeated failures? Was the client familiar? KAVACH connects authentication records with alerts and recent account risk so that these questions can be investigated within a small application whose logic can be inspected.'),
 ('The project asks', 'The project evaluates login events with explicit rules, combines the resulting alerts into a bounded account score, and lets a conversational interface retrieve relevant application data through tools. Statistical validation and deployment hardening remain further work.'),
 ('Figure~', r'Figure~\ref{fig:architecture} shows the browser, API, service layer, and external dependencies. Browser requests go through the backend, which controls access to PostgreSQL and the model provider. Application services save records, evaluate rules, and coordinate AI requests.'),
 ('The project is an application-level', 'KAVACH is a prototype for monitoring activity within the application. Detection uses fixed rules without training a machine-learning model. The IP rule compares stored addresses and performs no external reputation lookup. The device rule compares supplied strings, including user-agent information captured during authentication; those strings do not verify a physical device.'),
 ('An inactive-user alert', 'The inactive-user rule reads the account active flag and does not measure how long an account has been dormant. Quarantine sets that flag to false, affecting later authentication and JWT checks. It provides no operating-system isolation or firewall enforcement.'),
 ('No production traffic', 'The project materials contain no production traffic dataset, benchmark run, or labelled evaluation corpus. Detection accuracy and performance therefore remain unmeasured. Chapter 5 describes the interfaces and includes selected application screenshots supplied by the candidate.'),
 ('Chapters 2--4', 'Chapters 2--4 describe requirements, system design, and implementation. Chapter 5 presents the interfaces and validation plan. Chapter 6 discusses limitations and future work. The appendices contain the repository structure, database dictionary, API reference, publication statement, and biographical sketch.'),
])

revise('chapter2.tex', [
 ('Table~', r'The repository declares the dependencies in Table~\ref{tab:stack}. Development requires Java 21, a compatible Node.js environment, and PostgreSQL. Live inference also needs provider configuration and network access.'),
 ('The backend provides', r'Maven wrapper scripts build the backend. The frontend has scripts for development, production builds, preview, and linting. Vite uses port 5173 and proxies \code{/api} to \code{http://localhost:8080}. The Axios client can also use a configured API base URL.'),
 ('Protected requests', 'Protected requests must authenticate the caller and enforce role or ownership checks at sensitive entry points. Tool execution needs the same action-level policy. Alerts must preserve the matching rule, its reason, and its fixed weight. Controllers, services, repositories, DTOs, and pages divide these responsibilities across the application.'),
 ('Reliability requires', 'Reliability testing must check failed-login transactions, repeated detection, and recording failures. Performance testing must cover history queries, pagination, and AI requests with several execution cycles. UI screenshots provide no measure of load capacity or detection accuracy.'),
 ('Configuration values', r'Report examples omit local configuration values. Timestamp rules use \code{LocalDateTime}, so deployment needs a consistent time convention. Demonstration events must be identifiable alongside real login evidence. The project has no established minimum hardware specification or calibrated attack probabilities.'),
])

revise('chapter3.tex', [
 ('Controllers receive', r'HTTP controllers validate inputs and pass work to services. Services apply business rules and use JPA repositories to read entities and calculate aggregates. DTOs define the API data contracts. React pages share authentication and theme state and send requests through an Axios client \cite{repo}.'),
 ('The security chain', r'Authentication routes are public; other requests pass through the security chain. The JWT filter validates the token, looks up the current account, rejects inactive users, and sets the account role. Method security and selected ownership checks then restrict access to resources \cite{spring}. Registry tools enter services through a separate path, which needs equivalent authorization.'),
 ('The API client', 'The client sends JSON with bearer credentials and uses a 30-second timeout. Unauthorized responses clear stored session state. Agent execution can span several model and tool cycles, so its timeout, cancellation, and retry behavior need coordination with the client. Appendix C lists the direct endpoint scopes.'),
])

revise('chapter4.tex', [
 ('Registration trims', 'Registration trims the username and normalizes the email address before checking for duplicates. It encodes the password, creates an active USER account, and saves an audit event. The response contains safe account fields. Login checks the password with BCrypt, a one-way hashing scheme.'),
 ('Unknown usernames', 'An unknown username produces an audit failure and an unauthorized response, with no user-linked login record. A known inactive account is blocked, and the service attempts to record a failed login. It also records failed telemetry for an active account with an incorrect password. Valid credentials produce a JWT, a success audit entry, and successful login telemetry.'),
 ('JWT is a claims', r'JWT represents claims in the format defined by RFC 7519 \cite{jwt}. The browser attaches the token to later requests. The backend validates it and rechecks the current account state. Browser logout clears local authentication data; it does not revoke the token on the server.'),
 ('Authentication recording', r'The authentication recording method has a \code{REQUIRES_NEW} transaction annotation to preserve telemetry independently of a failed authentication transaction. It fills in missing IP, device, and location values, saves the event, and invokes detection. The caller catches recording exceptions, so the main login response can succeed or fail even when telemetry persistence fails.'),
 ('Explicit event creation', 'Administrators can create demonstration events with a user ID, timestamp, IP address, device, location, and status. Rules that use event time read the supplied login timestamp, including a historical one. Any resulting anomaly receives a separate timestamp when it is detected.'),
 ('All six rule methods', 'The detector evaluates all six rules in sequence. One event can match several: a failed login during an unusual hour can produce two anomalies, with another added if the brute-force threshold is met. The weights are fixed constants and have no dataset-based probability calibration.'),
 ('The new-IP and new-device', 'The IP and device rules search the account\'s stored history, excluding the current event by ID. Both require more than one event, so the first establishes a baseline without triggering either alert. Comparisons use all stored history, including failed events. Device matching ignores case.'),
 ('The inactive-account rule', 'The inactive-account rule reads a Boolean flag; it does not calculate dormancy from the last successful login. The IP rule supplies neither geolocation nor reputation information. Device strings identify reported client values without authenticating hardware.'),
 ('For failed event time', r'For a failed event at $t_e$, the repository counts failures with $t_{login}>t_e-10\text{ minutes}$. The query has no upper bound $t_{login}\leq t_e$. With chronological live events, this approximates a recent ten-minute count. For a backdated event, later records can also enter the count.'),
 ('Before insertion', 'Before saving an anomaly, the detector looks for the same user ID, anomaly type, and login-event ID. This check is intended to prevent duplicates during sequential reanalysis. Concurrent requests could both pass the existence check; preventing that requires a suitable unique constraint or locking policy, verified under concurrent execution.'),
 ('Let $A_u(t)$', 'Let $A_u(t)$ be the anomalies detected for user $u$ after $t-24$ hours, with stored weight $w_a$. The user risk score is'),
 ('LOW is below', 'Scores below 30 are LOW, 30--59 are MEDIUM, 60--79 are HIGH, and 80 or above are CRITICAL. The risky-user count includes accounts whose recent sum is at least 60. The watchlist query groups anomalies by account, caps each score at 100, sorts in descending order, and returns up to ten accounts.'),
 ('A failed login from', 'If a failed login also has an unseen IP address and device, the three matching rules contribute $20+40+30=90$, placing the account in the CRITICAL tier. This calculation illustrates the scoring logic and is not an observed attack result. Even the maximum score of 100 does not mean a 100 percent probability of compromise.'),
 ('The dashboard combines', 'The dashboard presents a risk summary, login analytics, a watchlist, and recent critical anomalies. These views use different time periods: some counts cover all stored records, account risk covers 24 hours, and the trend covers seven days. Readers must account for those periods when comparing figures. Global counts and watchlist accounts provide starting points for detailed investigation.'),
 ('The agent request', 'An agent request contains a prompt and may include context, a role, steering messages, and follow-ups. The service creates a local conversation, execution-step lists, and queues populated from the request. The outer loop starts an inner invocation and then processes the supplied follow-ups.'),
 ('Before each inner iteration', 'At the start of each inner iteration, the service adds at most one queued steering message to the conversation. The model or fallback planner returns text and any tool calls. The service resolves each tool by name, executes it, and adds its result or error to the conversation for the next cycle. The inner loop can finish when no tool calls or steering remain, and each invocation has a six-iteration limit.'),
 ('The outer loop consumes', 'Each remaining follow-up starts another inner invocation. After the outer loop finishes, the response contains final text, execution steps, tool names, loop counts, mode, model, and completion time. Investigator and operator specializations affect behavior within this single service and conversation; the implementation does not run them as separate agents.'),
 ('The queues are request-local', 'Steering and follow-ups are fixed when the request begins. This execution path has no channel for messages typed while it is running, so live steering requires further work. Tools run sequentially, including those whose metadata declares parallel safety.'),
 ('Each tool declares', 'Each tool has an argument schema, an assigned role, and safety metadata. The execution path still needs argument validation and authorization for the caller, action, and resource. Operational tools can modify application state, so their permissions must account for those effects as well as read access.'),
 ('Dedicated anomaly analysis', 'Dedicated anomaly analysis checks resource access before requesting structured JSON with a summary, explanation, indicators, implications, recommendations, and confidence. If the provider or parser fails, it produces a deterministic advisory response. Analysis history saves the result and an advisory flag.'),
 ('Action tools can', r'An explanation recommends action; an operational tool can actually change account status and save an audit event. Authorization must cover that execution. OWASP logging guidance addresses event selection, protection, and verification \cite{owasp}, providing criteria for further work. Tamper evidence has not been demonstrated for the existing database logs.'),
])

revise('chapter5.tex', [
 ('The React application', 'Signed-in users can open the anomaly, risk, login-log, and AI investigation pages. Administrators also have navigation to the global dashboard, directory, and audit records. The backend decides whether a request is authorized, regardless of which links the frontend displays.'),
 ('Login and registration', 'Login and registration sit outside the protected layout. The authentication context keeps the token and safe user details in local storage. The shared HTTP client attaches the bearer token and clears the session on relevant unauthorized responses. Directory controls change account state. The audit view displays security records, while the browser console provides diagnostics.'),
 ('Anomaly filters', 'Users can filter anomalies by rule type and severity and inspect their event context. The risk page summarizes the preceding 24 hours. Login views show the records behind the alerts, including administrator-created demonstration events. In the AI workspace, users select investigator, operator, or collaborative behavior and submit a prompt with optional context, steering, and follow-up arrays. The returned trace shows tool outcomes.'),
 ('The candidate\'s screenshots', r'The screenshots show interface states captured by the candidate. The repository has a context-loading test, but the project materials contain no controlled rule-test or load-test results. Table~\ref{tab:tests} defines the inputs and expected outcomes for validation; none of these rows records a test pass.'),
 (r'\noindent\textbf{Boundary coverage.}', 'Further tests must check cross-account access and administrative actions through both endpoints and tools. They must also cover invalid arguments, malformed model output, provider failures, concurrent inserts, and backdated events.'),
 (r'\noindent\textbf{Evaluation.}', 'Detection evaluation requires labelled ordinary and suspicious events, with precision and recall measured for each rule. Performance results must record hardware, data volume, concurrency, latency, and whether inference was live or in fallback mode. Deterministic and model-assisted results need separate measurements.'),
])

revise('chapter6.tex', [
 ('KAVACH combines', 'KAVACH records authenticated login activity, applies six explicit detection rules, and calculates a capped 24-hour account risk score. Security views and audit records support investigation. The LLM interface connects requests to thirteen application tools through a two-loop service, with deterministic fallback when live inference is unavailable. The repository and screenshots show the implementation and interface design. Detection accuracy and production performance still require measurement.'),
 ('Fixed schedules', 'Fixed login hours and comparisons of IP or device strings can identify unusual values without establishing account compromise. The weights remain uncalibrated. The brute-force query has no explicit upper time bound, and duplicate prevention needs concurrency testing. Steering is local to each request, tools run sequentially, and operational tools need consistent authorization. Storing audit records alone provides no demonstrated tamper resistance.'),
 ('Priorities are', 'The next priorities are a centralized authorization policy for tools, reliable event-time handling, database constraints, and integration tests for each rule. Agent sessions need authentication, cancellation, and live steering. Audit retention needs protection, and query limits and concurrent performance need testing. A labelled evaluation corpus should guide threshold calibration before adding learned anomaly models, external SIEM integration, or more authentication factors.'),
])

revise('screenshots.tex', [
 ('Six captures', 'These six candidate-provided captures show sign-in, overall monitoring, event investigation, personal risk, and the AI workspace. Their displayed content is unchanged. Counts and scores belong to the captured demonstration state; they are not evaluation measurements.'),
 ('The anomaly view', 'The anomaly list shows matching rules and their alert weights. The login view provides the underlying event fields. Filters and action buttons are visible, but the captures do not show what happened after those actions were selected.'),
 ('The personal view', 'The personal page shows the signed-in account\'s risk profile. Its recent 24-hour score and historical anomaly counts cover different periods. Although the interface uses subtitles such as ``Bayesian'' and ``neural'', Chapter 4 describes the implemented fixed rules and additive score. The AI screenshot captures the initial console before any completed model or tool execution.'),
])

# Diagram descriptions are prose; coordinates, technical labels and graph structure stay unchanged.
p = source / 'diagrams/design-views.tex'
t = p.read_text(encoding='utf-8')
descriptions = [
 'Account users and administrators access the same KAVACH system with different permissions. The context view groups the frontend, backend, and database inside that boundary. The optional model provider is an external dependency.',
 'KAVACH has three C4 containers: the React browser application, the Spring Boot backend, and PostgreSQL. A container here is an independently running application or data store; the repository does not establish a Docker deployment. The localhost proxy follows the Vite configuration.',
 'The backend contains security filters, controllers, domain and AI services, and repositories. Arrows show dependencies, so individual requests need only the relevant branches. Registry tools enter services outside controller methods and need their own authorization checks.',
 'The browser and JVM are the execution environments in this component view. Dashed arrows show usage dependencies and required interfaces. Domain services handle identity, monitoring, risk, and audit. AI components provide advisory analysis, orchestration, and operational tools.',
 'Authentication proceeds down the lifelines through calls (solid arrows) and responses (dashed arrows). For known accounts, the service attempts telemetry for successful, incorrect-password, and inactive-account outcomes. Unknown usernames produce an audit failure without a user-linked event. A recorded event can trigger several anomalies.',
 'The outer loop handles the initial task and supplied follow-ups. Each inner invocation allows up to six model or planner cycles. Tools run in sequence and feed results back into the conversation. The registry accesses application services and repositories, with live inference as an optional dependency.',
 'Users can have zero or more login records and anomalies. Each anomaly requires one user and one login event. AI history has optional links to either entity. The diagram includes mapped fields, keys, and multiplicities; cached identifiers and audit usernames have no declared foreign-key relationships.',
 'An administrator inherits ordinary authenticated use cases and has additional global and account-management operations. The external model service supports AI use cases. These associations describe intended application scope; equivalent restrictions still need enforcement in every agent tool.',
 'Requests and responses cross the boundary between one KAVACH process and three external entities: the account user, administrator, and optional model provider. Internal database stores first appear in the level 1 decomposition.',
 'Six processes handle identity and accounts, telemetry, detection, risk and analytics, AI investigation, and audit review. D1--D5 identify the five entity groups. Repeated actor and store symbols are aliases for the same entities. Risk is calculated on query; a detection write does not automatically run the risk process.',
 'Process 3.0 dispatches the event to six independent rules, then checks duplicates before saving each matching anomaly. Solid arrows carry events or candidates; dashed arrows carry history and existence-query feedback. The first event establishes the IP/device baseline. The failure-count query has no explicit upper event-time bound.',
 'Process 5.0 routes requests to dedicated advisory analysis or agent execution. The dedicated path explicitly saves structured history. The agent returns an execution trace and can query or change application data through tools. Each invocation needs checks for account scope and action permissions.',
]
lines = t.splitlines()
indices = [i for i, line in enumerate(lines) if line.startswith(r'\diagramview{')]
assert len(indices) == len(descriptions) == 12
for i, description in zip(indices, descriptions):
    line = lines[i]
    # Arguments have no nested braces in this master file.
    args = re.fullmatch(r'\\diagramview\{([^{}]*)\}\{([^{}]*)\}\{([^{}]*)\}\{([^{}]*)\}', line)
    assert args, line
    title, old, diagram, caption = args.groups()
    lines[i] = rf'\diagramview{{{title}}}{{{description}}}{{{diagram}}}{{{caption}}}'
p.write_text('\n'.join(lines)+'\n', encoding='utf-8')
changes['diagrams/design-views.tex'] = 12

revise('appendices/project-structure.tex', [
 ('KAVACH separates', 'The REST backend and browser frontend occupy separate directories. This tree lists the implementation files and folders, excluding generated builds, installed dependencies, and local configuration values.'),
])
revise('appendices/database-tables.tex', [
 ('The dictionary documents', 'The tables list JPA attributes, Java types, and any explicitly declared column names. PK denotes a primary key, FK a relationship, NN non-null, and UQ unique. All identifiers are identity-generated Long values, and enums use string storage. Initialization values are application defaults without implied SQL DEFAULT clauses. ORM configuration determines physical naming.'),
 (r'\noindent\textbf{Relationships:}', r'A user can have many login, anomaly, and analysis-history records. Audit records store usernames without a relationship to \code{users}. UserRole has two values: ADMIN and USER.'),
 ('Indexes are declared', r'The declared indexes cover \code{user_id}, \code{login_time}, \code{status}, and \code{ip_address}, named \code{idx_login_username}, \code{idx_login_time}, \code{idx_login_status}, and \code{idx_login_ip}, respectively. The name \code{idx_login_username} thus refers to an index on the user identifier.'),
 ('The six types', r'AnomalyType has six values: \code{FAILED_LOGIN}, \code{UNUSUAL_LOGIN_TIME}, \code{INACTIVE_USER_LOGIN}, \code{NEW_IP}, \code{NEW_DEVICE}, and \code{BRUTE_FORCE}. The service searches for the same user/type/login combination before saving. The entity has no composite uniqueness constraint for that combination.'),
 ('The JSON-labelled fields', 'Fields labelled JSON store serialized text in TEXT columns; the entity definitions do not map them to PostgreSQL JSONB. Optional relationships and cached IDs preserve analysis context. The history service and DTO control which fields reach the caller.'),
 ('The audit table persists', 'This table stores selected audit events. Its entity mapping provides no append-only restriction, hash chain, or database trigger that records every change.'),
])
revise('appendices/api-reference.tex', [
 ('All routes start', r'Every route has the prefix \code{/api}; \code{:name} marks a path variable. Public routes need no token. ADMIN and USER are application roles. Owner permits an administrator or the verified account owner, while Signed-in requires general authentication. These scopes follow source declarations and have not been verified by executed authorization tests. Agent tools need a separate execution policy.'),
 ('Registration requires', r'Registration accepts \code{username}, \code{email}, and \code{password}. DTO limits are 3--100 characters for username, 150 for email, and 8--72 for password. Login requires a nonblank username and password with limits of 100/72 characters. A failed login for a known account attempts telemetry recording. An unknown account produces an audit failure without a user-linked login record.'),
 ('Explicit event input', r'Event creation requires \code{userId}, \code{ipAddress}, and \code{status}, with optional \code{loginTime}, \code{location}, and \code{device}. Anomaly queries default to \code{page=0}, \code{size=10}, \code{sortBy=detectedAt}, and \code{direction=desc}. Page must be nonnegative and size must be 1--100. Sorting accepts \code{id}, \code{detectedAt}, \code{riskScore}, \code{severity}, and \code{anomalyType}.'),
 ('The analytics controller', 'Login analytics inherits the security chain\'s authentication requirement and has no ADMIN-only controller annotation. The dashboard routes separately require ADMIN access.'),
 (r'\noindent\textbf{Agent input.}', 'Agent execution requires a nonblank prompt. One request can also supply context, a role, steering messages, and follow-up arrays. The roles are investigator, operator, and collaborative. Responses contain final text, execution steps, tool names, loop counts, model/mode, and completion time.'),
 (r'\noindent\textbf{HTTP outcomes.}', 'Reads and analysis normally return 200. Declared creation routes return 201, and deletion returns 204. Errors use 400 for invalid input, 401 for credentials or tokens, 403 for denied access, 404 for a missing resource, and 409 for duplicate registration. Operational tools can change data in both fallback and live inference modes.'),
])

# Review record: unchanged tables, bibliography, biography and graph labels retain concise factual wording.
reviewed = ['Final_Thesis.tex', *[f'chapter{i}.tex' for i in range(1,7)], 'screenshots.tex',
            'appendix.tex', 'metadata.tex', *[p.relative_to(source).as_posix() for p in sorted((source/'appendices').glob('*.tex'))],
            *[p.relative_to(source).as_posix() for p in sorted((source/'diagrams').glob('*.tex'))]]
for name in reviewed:
    old = (before/name).read_text(encoding='utf-8')
    new = (source/name).read_text(encoding='utf-8')
    for pattern in [r'\\code\{[^}]*\}', r'\\(?:cite|ref|label|url|href|includegraphics|input|include)(?:\[[^\]]*\])?\{[^}]*\}',
                    r'\\begin\{equation\}.*?\\end\{equation\}', r'\\begin\{lstlisting\}.*?\\end\{lstlisting\}']:
        assert Counter(re.findall(pattern, old, re.S)) == Counter(re.findall(pattern, new, re.S)), (name, pattern)
    # Diagram sources, identity and biographical data must remain byte-equivalent in text.
    if name.startswith('diagrams/') and name != 'diagrams/design-views.tex' or name in ['metadata.tex','appendices/biography.tex','appendices/publications.tex']:
        assert old == new, name

audit = {'files_reviewed': reviewed, 'paragraphs_rewritten': changes, 'total_rewritten':sum(changes.values()),
         'uncovered_report_sections': [], 'preserved': ['inline code', 'paths and links', 'citations', 'equation', 'source tree', 'diagram code', 'identity and biography', 'tables and test cases']}
(root/'tmp/pdfs/humanizer-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(json.dumps({'rewritten_passages':sum(changes.values()),'reviewed_tex_files':len(reviewed)},indent=2))

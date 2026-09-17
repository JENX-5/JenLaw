export const JENLAW_SYSTEM_PROMPT = `You are JenLaw, an AI-powered legal information and document understanding assistant.

Your purpose is to help non-lawyers understand, navigate, compare, and organize information contained in legal documents. You provide legal information and practical assistance, but you do not replace a qualified lawyer or provide professional legal advice.

CORE PRINCIPLES

1. SOURCE-GROUNDED
   Base your responses primarily on the documents, text, or information provided by the user.
   Do not invent facts, clauses, obligations, deadlines, legal rules, or consequences.
   When information is missing, explicitly say that it is not provided.

2. DISTINGUISH FACT FROM INTERPRETATION
   Clearly distinguish between:
   - What the document explicitly states
   - What the clause appears to mean in plain language
   - What may require further legal interpretation
   Never present an interpretation as though it were directly stated in the document.

3. COMPREHENSIVE DETAIL & ACCESSIBILITY
   Provide comprehensive, highly detailed, and nuanced explanations.
   Do not omit important mechanisms or caveats.
   Define all legal jargon immediately using everyday analogies.
   Use clear, professional, yet accessible language.

4. NO LEGAL ADVICE
   Do not tell a user what to do or predict court outcomes.
   Use phrases like "The document says..." rather than "You must...".

5. FORMATTING & SPACING
   ALWAYS insert a blank line between every paragraph and list item for readability.
   Use bullet points extensively rather than dense block paragraphs.
   When using headers, ALWAYS include a newline ([Newline]) after the header.

6. USER PERSPECTIVE
   When the user's role is known, interpret relevant provisions from that person's perspective (e.g. Employee, Tenant, Buyer, etc.).
   If the user's role is unknown and it materially affects the analysis, state that limitation rather than assuming.

5. IMPORTANT TERMS
   Pay particular attention to: financial obligations, payment terms, fees and penalties, deadlines, notice periods, automatic renewal, termination rights, liability, indemnification, confidentiality, intellectual property, non-compete or non-solicitation provisions, dispute resolution, governing law, warranties, restrictions, material changes in obligations, ambiguous or unusually broad language.

6. EVIDENCE REFERENCES
   Whenever possible, identify the relevant section, clause, paragraph, page, or other source location supporting an important statement. Never create a section number or citation that does not exist.

7. UNCERTAINTY
   When the document is ambiguous, incomplete, contradictory, or insufficient to answer a question, say so clearly. Use language such as: "The document states...", "This appears to mean...", "The document does not specify...", "This may depend on...", "A lawyer could help determine whether..."

8. LEGAL SAFETY
   Do not: claim to be a lawyer; claim that a provision is definitely legal or illegal; guarantee an outcome in court; tell the user they will or will not win a case; present general information as personalized legal advice; encourage the user to ignore professional legal advice when professional review is appropriate.

9. ACTIONABLE HELP
   Whenever appropriate, turn analysis into useful outputs such as: plain-English explanations, key-term summaries, obligation lists, important-date lists, questions to ask, items to clarify, items to negotiate, review checklists, questions to raise with a legal professional.

10. RESPONSE QUALITY
    Be concise but sufficiently detailed. Prioritize information that could materially affect the user's understanding, obligations, cost, rights, deadlines, or decisions. Do not overwhelm the user with unnecessary legal terminology.

DEFAULT RESPONSE STRUCTURE
When analyzing a document, organize the response where relevant into:
1. What this document is
2. What it means in plain English
3. Your key obligations
4. The other party's key obligations
5. Important dates and money
6. Clauses that deserve attention
7. What the document does not tell us
8. Questions the user may want to ask
9. Questions to consider asking a legal professional

Always adapt the structure to the user's actual question.

FINAL RULE
Your goal is not simply to summarize legal text. Your goal is to help the user understand: "What am I agreeing to, what could materially affect me, what do I need to clarify, and what should I discuss with a qualified professional?"

FORMATTING
Use Markdown formatting for clarity: headers (##, ###), bold, bullet lists. Keep responses structured and easy to scan.`;

// ── QA Prompt ──────────────────────────────────────────────────────────
export const QA_PROMPT = `Answer the user's question using the supplied legal document.

DOCUMENT:
{DOCUMENT_TEXT}

USER ROLE:
{USER_ROLE}

USER QUESTION:
{QUESTION}

INSTRUCTIONS

1. Search the document for provisions relevant to the question.
2. Answer using information supported by the document.
3. Identify the specific clause, section, paragraph, or page supporting the answer.
4. Clearly distinguish:
* What the document explicitly says
* What that means in plain language
* What cannot be determined from the document

5. If the answer is not contained in the document, say:
   "The document does not provide enough information to answer this question."

6. Never invent information to make the answer more complete.
7. If the question depends on jurisdiction, facts outside the document, or legal interpretation, identify that limitation.
8. Do not present the answer as definitive legal advice.

OUTPUT FORMAT

**ANSWER**
Give the clearest answer possible.

**WHAT THE DOCUMENT SAYS**
[Newline]
Quote or paraphrase only the relevant provision.

**PLAIN-ENGLISH MEANING**
[Newline]
Explain the provision simply.

**SOURCE**
[Newline]
Provide the section, clause, paragraph, or page.

**WHAT IS UNCERTAIN**
[Newline]
Identify anything that cannot be determined.

**POSSIBLE NEXT QUESTION**
[Newline]
Suggest one useful question the user could investigate or discuss with a qualified legal professional when appropriate.`;

// ── Scenario Prompt ──────────────────────────────────────────────────────────
export const SCENARIO_PROMPT = `Analyze the user's hypothetical scenario using only the supplied legal document.

DOCUMENT:
{DOCUMENT_TEXT}

USER ROLE:
{USER_ROLE}

SCENARIO:
{SCENARIO}

TASK

Determine which provisions of the document are relevant to the scenario.

Then explain:

1. WHAT THE DOCUMENT EXPLICITLY SAYS
Identify the relevant contractual language.

2. WHAT IT APPEARS TO MEAN
Explain the provisions in plain English.

3. HOW THEY RELATE TO THE SCENARIO
Explain how the stated facts interact with the document.

4. POTENTIAL CONTRACTUAL CONSEQUENCES
Identify consequences that are explicitly stated or reasonably connected to the document's provisions.

5. RELEVANT SOURCES
List the relevant sections or clauses.

6. WHAT THE DOCUMENT DOES NOT ANSWER
Identify missing information or uncertainties.

RULES

Do not invent facts.

Do not assume facts that the user did not provide.

Do not predict court outcomes.

Do not say that the user will definitely win, lose, owe money, or be legally protected unless this is directly stated in the document, and even then describe the document's position rather than guaranteeing a legal outcome.

Use qualified language where appropriate.

OUTPUT FORMAT

**SCENARIO**
[Newline]
{SCENARIO}
[Newline]

**RELEVANT CLAUSES**
[Newline]
...
[Newline]

**PLAIN-ENGLISH EXPLANATION**
[Newline]
...
[Newline]

**POTENTIAL CONTRACTUAL EFFECT**
[Newline]
...
[Newline]

**WHAT IS UNCERTAIN**
[Newline]
...
[Newline]

**SOURCE REFERENCES**
[Newline]
...
[Newline]

**QUESTIONS TO CONSIDER**
[Newline]
...
[Newline]`;

// ── Compare Prompt ─────────────────────────────────────────────────────────
export const COMPARE_PROMPT = `Compare the two supplied legal documents.

DOCUMENT A:
{DOCUMENT_A}

DOCUMENT B:
{DOCUMENT_B}

TASK

Identify all material differences between the documents.

Compare:

- Parties
- Dates
- Duration
- Payments
- Fees
- Penalties
- Obligations
- Termination
- Notice periods
- Renewal
- Liability
- Indemnification
- Confidentiality
- Intellectual property
- Restrictions
- Warranties
- Dispute resolution
- Governing law
- Other material clauses

For each difference determine whether the provision was:

ADDED
REMOVED
MODIFIED
UNCHANGED

For every material change provide a formatted Markdown section:

### [Category of Change] ([ADDED, REMOVED, MODIFIED, or UNCHANGED])
* **Document A:** [What it says in A]
* **Document B:** [What it says in B]
* **Practical Significance:** [What this means in plain language]
* **Sources:** [Location in A] vs [Location in B]

Then produce:

1. EXECUTIVE SUMMARY
Summarize the most important changes in simple language.

2. TOP 5 CHANGES
Identify the five changes that deserve the most attention.

3. USER IMPACT
Explain how the material changes may affect the user based only on the documents.

4. MISSING OR UNCLEAR ITEMS
Identify provisions that cannot be reliably compared because one or both documents are incomplete or unclear.

IMPORTANT

Do not characterize a change as legally better or worse unless the documents explicitly support that conclusion.

Instead use language such as:
- "This increases the notice period."
- "This removes the previous limitation."
- "This introduces an additional obligation."
- "This may have a greater financial impact."

Do not invent missing clauses.`;

// ── Verification Prompt ───────────────────────────────────────────────
export const VERIFICATION_PROMPT = `You are the final verification layer for JenLaw.

SOURCE DOCUMENT:
{DOCUMENT_TEXT}

GENERATED RESPONSE:
{GENERATED_RESPONSE}

Review the generated response against the source document.

CHECK FOR:

1. Unsupported factual claims
2. Invented clauses
3. Incorrect clause references
4. Incorrect dates
5. Incorrect amounts
6. Unsupported obligations
7. Unsupported legal conclusions
8. Statements presented with excessive certainty
9. Confusion between document language and interpretation
10. Missing important limitations
11. Claims that depend on jurisdiction or facts not provided
12. Statements that improperly present legal information as professional legal advice

FOR EACH PROBLEM RETURN:

{
  "issue": "",
  "severity": "LOW | MEDIUM | HIGH",
  "problematic_statement": "",
  "why_it_is_problematic": "",
  "source_support": "",
  "recommended_correction": ""
}

SEVERITY

LOW
Minor wording or clarity issue.

MEDIUM
Potentially misleading interpretation or unsupported statement.

HIGH
Fabricated information, incorrect source reference, material factual error, or definitive legal conclusion unsupported by the document.

FINAL DECISION

Return one of:

PASS
The response is adequately supported and appropriately qualified.

REVISE
The response contains issues that should be corrected before being shown to the user.

If REVISE, provide a corrected version of the response.

FINAL RULE

JenLaw must prefer:
"I cannot determine this from the provided document."

over inventing an answer.`;

// ── Checklist Prompt ──────────────────────────────────────────────────
export const CHECKLIST_PROMPT = `Create an actionable checklist based on the legal document analysis.

DOCUMENT:
{DOCUMENT_TEXT}

ANALYSIS:
{ANALYSIS}

USER ROLE:
{USER_ROLE}

Generate four sections.

1. BEFORE YOU SIGN / ACCEPT

Identify things the user should verify or understand before signing or accepting the document.

2. THINGS TO CLARIFY

Identify ambiguous, missing, unusually broad, or potentially confusing provisions that the user may want clarified.

3. POSSIBLE NEGOTIATION POINTS

Identify provisions that the user may wish to discuss or negotiate.

Do not claim that the user has a legal right to negotiate a provision.

4. QUESTIONS FOR A LEGAL PROFESSIONAL

Generate specific, concise questions that the user could take to a qualified lawyer.

Questions should be based on the actual document.

Do not fabricate legal issues.

OUTPUT

OUTPUT

### CHECK BEFORE SIGNING
[Newline]
[checkbox items formatted as '- [ ] ']
[Newline]

### CLARIFY
[Newline]
[checkbox items formatted as '- [ ] ']
[Newline]

### DISCUSS / NEGOTIATE
[Newline]
[checkbox items formatted as '- [ ] ']
[Newline]

### QUESTIONS FOR A LAWYER
[Newline]
[numbered questions]
[Newline]

IMPORTANT

The checklist provides informational assistance and is not a substitute for legal advice.`;

// ── Lawyer Briefing Prompt ───────────────────────────────────────────
export const BRIEFING_PROMPT = `Create a concise briefing document to help the user prepare for a consultation with a qualified legal professional.

DOCUMENT:
{DOCUMENT_TEXT}

USER ROLE:
{USER_ROLE}

DOCUMENT ANALYSIS:
{ANALYSIS}

Create the following:

1. MATTER OVERVIEW
[Newline]
Explain what the document appears to concern. Use bullet points if applicable.
[Newline]

2. USER'S POSITION
[Newline]
Use a bulleted list to summarize the user's major obligations and relevant rights or protections described in the document.
[Newline]

3. IMPORTANT TERMS
[Newline]
Use a bulleted list to list the provisions most relevant to the user's situation.
[Newline]

4. ATTENTION POINTS
[Newline]
Use a bulleted list for the most important provisions requiring clarification or professional review.
[Newline]

5. QUESTIONS TO ASK
[Newline]
Use a bulleted list to create specific questions the user can ask their lawyer.
[Newline]

6. INFORMATION TO BRING
[Newline]
Use a bulleted list to identify facts or documents that may be useful during a legal consultation, based on the issues identified.
[Newline]

7. TIMELINE
[Newline]
Use a bulleted list to track important deadlines, notice periods, renewals, or dates that may be relevant.
[Newline]

RULES

Do not provide a legal conclusion.

Do not claim that a clause is enforceable or unenforceable.

Do not tell the user what legal action they must take.

The purpose is to help the user have a more informed conversation with a qualified legal professional.`;

// ── Deep Extract prompt template ────────────────────────────────────────
export const DEEP_EXTRACT_PROMPT = `Analyze the legal document provided below.

Your task is to identify and structure the key factual information contained in the document.

DOCUMENT:
{DOCUMENT_TEXT}

Extract the following:

1. DOCUMENT INFORMATION
* Document type
* Document title
* Purpose
* Effective date
* Expiration date
* Duration
* Governing law or jurisdiction mentioned

2. PARTIES — For each party identify: Name, Role, Relevant responsibilities

3. FINANCIAL TERMS — Identify: Prices, Payments, Deposits, Fees, Interest, Penalties, Reimbursements, Increases or adjustments, Payment deadlines

4. OBLIGATIONS — Separate into: User obligations (role: {USER_ROLE}), Other party obligations, Shared obligations

5. DATES AND DEADLINES — Start dates, End dates, Notice periods, Renewal dates, Payment deadlines, Performance deadlines

6. TERMINATION — Who can terminate, When termination is allowed, Required notice, Early termination provisions, Termination fees or penalties, Consequences

7. LIABILITY AND PROTECTION — Liability limitations, Indemnification, Warranties, Disclaimers, Insurance requirements

8. RESTRICTIONS — Confidentiality, Intellectual property, Non-compete, Non-solicitation, Use restrictions, Assignment restrictions

9. DISPUTES — Dispute resolution method, Arbitration, Court/jurisdiction, Governing law, Venue

10. UNUSUAL OR IMPORTANT PROVISIONS — Provisions that are financially significant, restrictive, broad, ambiguous, one-sided, unusual, or particularly consequential

OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code fences, no explanation) using exactly this schema:

{
  "document_type": "",
  "document_title": "",
  "purpose": "",
  "parties": [{"name":"","role":"","responsibilities":"","source":""}],
  "effective_date": "",
  "expiration_date": "",
  "duration": "",
  "jurisdiction": "",
  "financial_terms": [{"item":"","detail":"","source":""}],
  "user_obligations": [{"obligation":"","source":""}],
  "other_party_obligations": [{"obligation":"","source":""}],
  "shared_obligations": [{"obligation":"","source":""}],
  "important_dates": [{"label":"","date":"","source":""}],
  "termination_terms": [{"item":"","detail":"","source":""}],
  "liability_terms": [{"item":"","detail":"","source":""}],
  "restrictions": [{"type":"","detail":"","source":""}],
  "dispute_terms": [{"item":"","detail":"","source":""}],
  "important_provisions": [{"title":"","detail":"","reason":"","source":""}]
}

For every extracted item, include its source location (section number, clause, page) whenever available.
Do not infer information that is not present. Use "Not specified" rather than guessing.`;

// ── Plain English Explanation prompt template ─────────────────────────
export const PLAIN_ENGLISH_PROMPT = `Explain the following legal document in plain English.

DOCUMENT:
{DOCUMENT_TEXT}

USER ROLE:
{USER_ROLE}

Your goal is to help a non-lawyer understand the document without changing its meaning.

For each important provision:

1. Identify the provision.
2. Explain what it says in plain English.
3. Explain who it affects.
4. Explain when it applies.
5. Mention any conditions or exceptions.
6. Provide the relevant section or source location.

Organize the explanation into:

A. WHAT THIS DOCUMENT IS
[Newline]
Provide a brief explanation of what the document does. Use bullet points if applicable.

B. WHAT THE USER IS AGREEING TO
[Newline]
Use a bulleted list to explain the user's major commitments.

C. WHAT THE OTHER PARTY AGREES TO
[Newline]
Use a bulleted list to explain the other party's major commitments.

D. MONEY
[Newline]
Use a bulleted list to explain important payments, fees, deposits, penalties, increases, and financial commitments.

E. TIME AND DEADLINES
[Newline]
Use a bulleted list for important dates, notice periods, renewals, and deadlines.

F. TERMINATION
[Newline]
Use a bulleted list to explain how how the agreement can end and what happens afterward.

G. IMPORTANT RESTRICTIONS
[Newline]
Use a bulleted list to explain confidentiality, intellectual property, non-compete, non-solicitation, assignment, or other restrictions.

H. DISPUTES
[Newline]
Explain how disagreements are supposed to be handled.

I. TERMS THAT NEED CAREFUL READING
[Newline]
Use a bulleted list to identify provisions that deserve particular attention.

For every explanation, distinguish clearly between:

* What the document says
* Your plain-English explanation
* Anything that remains uncertain

Do not add rights or obligations that do not appear in the document.
Do not claim that a clause is legally valid or invalid.
End with a brief disclaimer reminding the user this is legal information, not legal advice.`;

// ── Red Flags & Risks prompt template ──────────────────────────────
export const RED_FLAGS_PROMPT = `Review the supplied legal document and identify provisions that deserve particular attention from the user.

DOCUMENT:
{DOCUMENT_TEXT}

USER ROLE:
{USER_ROLE}

Focus on provisions that could materially affect:
* Money
* Obligations
* Deadlines
* Rights
* Restrictions
* Liability
* Ability to terminate
* Renewals
* Confidentiality
* Intellectual property
* Dispute resolution
* Other important decisions

Classify each finding as:

GOOD_TO_KNOW
Important information that the user should understand but that does not appear especially concerning.

ATTENTION
A provision that may materially affect the user's obligations, costs, flexibility, or rights and deserves careful review.

HIGH_ATTENTION
A provision that appears particularly consequential, broad, restrictive, financially significant, ambiguous, or unusual and may warrant discussion with a qualified legal professional.

For every finding provide a beautifully formatted Markdown section with a blank line after it:

### 🔴 [Title] (if HIGH_ATTENTION) or 🟡 [Title] (if ATTENTION) or 🔵 [Title] (if GOOD_TO_KNOW)
[Newline]
* **What the document says:** [Summary of provision]
* **Simple Explanation:** [What it actually means, detailing the specific mechanisms of how it works]
* **Why it matters:** [How it could affect the user in everyday life and the specific risks involved]
* **Who is affected:** [Which party]
* **Source:** [Section/Clause/Page]
* **Uncertainty:** [Any unknown factors or limitations]
[Newline]

IMPORTANT RULES

Do not determine that a clause is illegal or unenforceable.
Do not assume that a provision is unfair merely because it is unfavorable to the user.
Do not invent consequences.

Use wording such as:
* "may"
* "could"
* "appears to"
* "the document states"

When the significance of a provision depends on facts or jurisdiction not provided, state that explicitly.

At the end, provide:

TOP 5 PROVISIONS TO REVIEW
Rank the five provisions that deserve the user's closest attention based on the document alone.
`;



export const DEMO_RED_FLAGS = `## 🚩 Red Flags & Risks — Demo Mode

> *This is a demonstration response. Load a real document and add a Gemini API key in ⚙️ Settings to get a real analysis.*

---

**HIGH_ATTENTION**
**1. Non-compete clause (Clause 10.1)**
**What it says:** Prohibits working for competitors within a 50-mile radius for 12 months after leaving.
**Plain English:** You can't take a similar job nearby for a whole year.
**Why it matters:** Limits your future career options. 
**Uncertainty:** May not be enforceable depending on the jurisdiction.

**ATTENTION**
**2. Confidentiality duration (Clause 8)**
**What it says:** Applies during and indefinitely after employment.
**Plain English:** You must keep information secret forever.
**Why it matters:** You could accidentally violate this years later.

---
### TOP 5 PROVISIONS TO REVIEW
1. **Clause 10.1 (Non-compete)**
2. **Clause 8 (Confidentiality)**
3. **Clause 4.1 (Salary Adjustments)**
4. **Clause 3.1 (Full-time commitment)**
5. **Clause 12 (Dispute resolution)**`;

export const ROLES = [
  'Not specified',
  'Employee',
  'Employer',
  'Tenant',
  'Landlord',
  'Customer',
  'Vendor',
  'Borrower',
  'Lender',
  'Buyer',
  'Seller',
  'Contractor',
  'Client',
  'Investor',
  'Founder',
  'Partner',
];

export const HINT_MESSAGES = [
  'What does this document require me to do?',
  'Are there any automatic renewal clauses?',
  'What happens if I want to cancel early?',
  'Explain the liability and indemnification clauses.',
  'What are the most important things I should know?',
  'Is there a non-compete or confidentiality clause?',
];

// ── Demo responses (no API key) ──────────────────────────────────────────
export const DEMO_RESPONSES = {
  default: `## 👋 No Document Loaded Yet

To get started, please **upload a PDF** or **paste your document text** using the panel on the left.

Once you've added a document, I can help you:

- **Summarize** what it means in plain English
- **Identify your key obligations** and deadlines
- **Flag red flags** and clauses you should review carefully
- **Extract financial terms** and payment obligations
- **Answer specific questions** about any clause or provision

---

> ⚠️ **Reminder:** I provide legal *information*, not legal *advice*. For decisions that could significantly affect your rights or finances, please consult a qualified legal professional.`,

  no_doc: `## ⚠️ No Document Provided

I don't see any document loaded yet. Please:

1. **Upload a PDF** using the upload zone in the left panel, or
2. **Paste your document text** using the "Paste Text" button

Once you provide a document, I'll be able to analyse it and answer your questions based on its actual contents.`,

  summarize: `## 📋 Document Summary

> *Note: This is a demonstration response. To get a real analysis of your document, please add your Gemini API key in Settings and upload your document.*

### What This Document Is
This appears to be a **[Document Type]** — a legal agreement between two or more parties that sets out their respective rights and obligations.

### What It Means in Plain English
In simple terms, this document establishes the key terms under which the parties agree to [purpose]. Both sides agree to specific obligations and the agreement is enforceable under [governing law, if stated].

### Your Key Obligations
- Pay [amount] on [date]
- Provide [X days] notice before terminating
- Maintain confidentiality of [specified information]

### Important Dates & Money
| Item | Detail |
|---|---|
| Effective Date | [Date from document] |
| Payment Due | [Date or frequency] |
| Notice Period | [X days] |
| Termination Date | [Date, if fixed] |

### ⚠️ Clauses That Deserve Attention
- **Auto-renewal clause** — The agreement may renew automatically unless you provide notice
- **Liability limitation** — Your ability to claim damages may be capped
- **Governing law** — Disputes may need to be resolved in a specific jurisdiction

---

*To get a real analysis, add your Gemini API key in ⚙️ Settings.*`,
};

// ── Demo deep-extract data ───────────────────────────────────────────────
export const DEMO_EXTRACT_JSON = {
  document_type: 'Employment Agreement',
  document_title: 'Full-Time Employment Agreement — [DEMO]',
  purpose: 'Establishes the terms and conditions of employment between the Company and the Employee, including compensation, duties, and post-employment restrictions.',
  effective_date: 'Not specified in demo — load a real document for actual dates',
  expiration_date: 'Not specified',
  duration: 'At-will / Indefinite',
  jurisdiction: 'Not specified — demo mode only',
  parties: [
    { name: 'Acme Corp Ltd', role: 'Employer / Company', responsibilities: 'Pay salary, provide benefits, maintain safe working conditions', source: 'Preamble' },
    { name: 'Jane Smith', role: 'Employee', responsibilities: 'Perform assigned duties, maintain confidentiality, comply with company policies', source: 'Preamble' },
  ],
  financial_terms: [
    { item: 'Annual Salary', detail: '$[Amount] per annum, payable monthly', source: 'Clause 4.1' },
    { item: 'Bonus', detail: 'Discretionary annual bonus up to 15% of base salary', source: 'Clause 4.2' },
    { item: 'Pension', detail: 'Employer contributes 5% of salary to pension scheme', source: 'Clause 4.3' },
  ],
  user_obligations: [
    { obligation: 'Devote full working time to the Company', source: 'Clause 3.1' },
    { obligation: 'Maintain confidentiality of Company information during and after employment', source: 'Clause 8' },
    { obligation: 'Report conflicts of interest immediately', source: 'Clause 5.2' },
    { obligation: 'Comply with all Company policies and codes of conduct', source: 'Clause 3.3' },
  ],
  other_party_obligations: [
    { obligation: 'Pay agreed salary on time each month', source: 'Clause 4.1' },
    { obligation: 'Provide statutory notice or payment in lieu', source: 'Clause 12.2' },
    { obligation: 'Provide written reasons for dismissal', source: 'Clause 12.3' },
  ],
  shared_obligations: [
    { obligation: 'Maintain a professional and respectful working environment', source: 'Clause 3' },
  ],
  important_dates: [
    { label: 'Start Date', date: '[As specified in offer letter]', source: 'Clause 1' },
    { label: 'Probation Period End', date: '3 months from Start Date', source: 'Clause 2.1' },
    { label: 'Notice Period (after probation)', date: '1 month written notice', source: 'Clause 12.1' },
    { label: 'Salary Review', date: 'Annually in [Month]', source: 'Clause 4.4' },
  ],
  termination_terms: [
    { item: 'Who can terminate', detail: 'Either party', source: 'Clause 12' },
    { item: 'Required notice', detail: '1 month written notice after probation; 1 week during probation', source: 'Clause 12.1' },
    { item: 'Summary dismissal', detail: 'Company may terminate without notice for gross misconduct', source: 'Clause 12.4' },
    { item: 'Garden leave', detail: 'Company may place employee on garden leave during notice period', source: 'Clause 12.5' },
  ],
  liability_terms: [
    { item: 'Limitation of liability', detail: 'Company liability limited to direct losses only; no consequential damages', source: 'Clause 14' },
    { item: 'Indemnification', detail: 'Employee indemnifies Company for losses arising from wilful misconduct', source: 'Clause 14.2' },
  ],
  restrictions: [
    { type: 'Confidentiality', detail: 'Covers all proprietary and business information; survives termination indefinitely', source: 'Clause 8' },
    { type: 'Intellectual Property', detail: 'All work product created during employment belongs to the Company', source: 'Clause 9' },
    { type: 'Non-compete', detail: 'Cannot work for a competitor for 12 months within a 50-mile radius after termination', source: 'Clause 10.1' },
    { type: 'Non-solicitation', detail: 'Cannot solicit Company clients or employees for 12 months after termination', source: 'Clause 10.2' },
  ],
  dispute_terms: [
    { item: 'Governing law', detail: 'Laws of England and Wales', source: 'Clause 16' },
    { item: 'Dispute resolution', detail: 'Internal grievance procedure first; then ACAS Early Conciliation', source: 'Clause 15' },
    { item: 'Jurisdiction', detail: 'Courts of England and Wales', source: 'Clause 16' },
  ],
  important_provisions: [
    { title: '🚩 Broad Non-Compete Clause', detail: '12-month post-employment non-compete within 50-mile radius covering all competitor companies', reason: 'This is unusually broad. Enforceability depends on jurisdiction and reasonableness. You may be unable to work in your field for a year.', source: 'Clause 10.1' },
    { title: '⚠️ IP Ownership — Work Outside Hours', detail: 'All inventions or creations made during employment are assigned to the Company, without limitation to work hours or Company equipment', reason: 'This may capture personal projects or side work created on your own time. Seek clarification.', source: 'Clause 9.2' },
    { title: '⚠️ Garden Leave Provision', detail: 'Company can require you to stay home during your notice period while preventing you from working elsewhere', reason: 'This restricts your ability to start a new role immediately after resignation.', source: 'Clause 12.5' },
    { title: '💡 Discretionary Bonus', detail: 'Bonus of up to 15% described as "entirely discretionary" with no performance criteria specified', reason: 'This means the bonus can be withheld for any reason. It is not a contractual entitlement.', source: 'Clause 4.2' },
  ],
};

// ── Demo plain-english response ──────────────────────────────────────────
export const DEMO_PLAIN_ENGLISH = `## 📖 Document Summary — Demo Mode

> *This is a demonstration response. Load a real document and add a Gemini API key in ⚙️ Settings to get a real analysis.*

---

## A. WHAT THIS DOCUMENT IS

**What the document says:** This is a Full-Time Employment Agreement between [Employer] and [Employee].

**In simple terms:** This is a legal contract between you and a company that sets the terms of your job — what you’ll do, what you’ll be paid, and what rules you both agree to follow. By signing, you both become legally bound by its terms.

---

## B. WHAT THE USER IS AGREEING TO

**Clause 3.1 — Full-time commitment**
**What it says:** You agree to devote your full working time and attention to the Company.
**Simple Explanation:** You cannot work another job while employed here, without permission.
**Conditions:** No exceptions are stated. This may apply outside working hours as well — the scope is unclear.

**Clause 8 — Confidentiality**
**What it says:** You must keep all Company information confidential, during and after employment.
**Simple Explanation:** Even after you leave, you cannot share internal information, client lists, or business strategies with anyone outside the Company.
**Conditions:** This obligation survives termination with no stated time limit. Duration of confidentiality is not specified.

**Clause 10.1 — Non-compete**
**What it says:** For 12 months after leaving, you cannot work for a competitor within a 50-mile radius.
**Simple Explanation:** After you quit or are fired, you may not take a similar role at a rival company for a full year, within a wide geographic area. Whether this is enforceable depends on your location.
**Uncertain:** Enforceability varies significantly by jurisdiction. A lawyer could advise whether this applies to you.

---

## C. WHAT THE OTHER PARTY AGREES TO

**Clause 4.1 — Salary**\`;

**What it says:** The Company agrees to pay your salary monthly.
**Simple Explanation:** You will receive your pay once a month, as long as you remain employed.

**Clause 12.2 — Notice**
**What it says:** The Company must give you statutory notice or pay in lieu of notice if terminating your employment.
**Simple Explanation:** They cannot simply stop your pay without warning. They must either give you advance notice or pay you for the notice period.

---

## D. MONEY

**Annual Salary** *(Clause 4.1)*: Payable monthly. Amount specified in the offer letter or schedule.

**Bonus** *(Clause 4.2)*: Up to 15% of base salary. Described as **entirely discretionary** — this is not a guaranteed payment.

**Pension** *(Clause 4.3)*: Employer contributes 5% of salary to a pension scheme.

**What to watch:** Because the bonus is discretionary with no criteria specified, the company can withhold it for any reason, or no reason. It is not a contractual entitlement.

---

## E. TIME AND DEADLINES

| Item | Detail | Source |
|---|---|---|
| Start Date | As specified in the offer letter | Clause 1 |
| Probation Period | 3 months | Clause 2.1 |
| Notice (during probation) | 1 week | Clause 12.1 |
| Notice (after probation) | 1 month written notice | Clause 12.1 |
| Salary Review | Annually | Clause 4.4 |
| Non-compete period | 12 months post-termination | Clause 10.1 |

---

## F. TERMINATION

**Clause 12 — Either party can terminate.** You can resign; the company can dismiss you.

**Notice requirement** *(Clause 12.1)*: 1 month’s written notice after probation (1 week during probation).

**Summary dismissal** *(Clause 12.4)*: The Company can terminate you immediately, without notice, if you commit gross misconduct. The document does not define what constitutes gross misconduct.

**Garden leave** *(Clause 12.5)*: During your notice period, the company can tell you to stay home and not work for anyone else. **Simple Explanation:** Even after you resign, they may stop you from starting a new job for up to 1 month while paying your salary.

---

## G. IMPORTANT RESTRICTIONS

**Non-Compete** *(Clause 10.1)*: 12 months, 50-mile radius, all competitors.
**Non-Solicitation** *(Clause 10.2)*: Cannot approach Company clients or employees for 12 months after leaving.
**IP Ownership** *(Clause 9)*: All work you create during employment belongs to the Company. The clause may not be limited to work done during business hours — this is worth clarifying.
**Confidentiality** *(Clause 8)*: No time limit stated. Survives termination indefinitely.

---

## H. DISPUTES

**Clause 15:** Disputes should first be raised through the Company’s internal grievance procedure, then through ACAS Early Conciliation before going to court.
**Clause 16 — Governing law:** The laws of England and Wales apply.
**Jurisdiction:** Courts of England and Wales.

**Simple Explanation:** If you have a problem, you’re expected to try to resolve it internally first. If that fails, there is an ACAS process before you can sue. This is standard for employment agreements in England.

---

## I. TERMS THAT NEED CAREFUL READING

**1. 🚩 Non-Compete (Clause 10.1)**
Very broad — 12 months and 50-mile radius. May significantly limit your career options after leaving. Enforceability depends on your jurisdiction.

**2. ⚠️ IP Ownership Scope (Clause 9.2)**
May capture personal projects created outside work hours. Ask the employer to clarify this before signing.

**3. 💡 Discretionary Bonus (Clause 4.2)**
The bonus is not a contractual right. Do not rely on it financially.

**4. Garden Leave (Clause 12.5)**
Could delay your ability to start a new role. Factor this into any job transition planning.

---

> ⚠️ **This is legal information, not legal advice.** The explanation above is based on the document text provided and is intended to help you understand it. It does not constitute professional legal advice, and you should consult a qualified lawyer before signing or relying on any legal agreement.

*— JenLaw*`;

function getDemoResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  if (!state.documentText) return DEMO_RESPONSES.no_doc;
  if (msg.includes('summarize') || msg.includes('summary') || msg.includes('what is this')) return DEMO_RESPONSES.summarize;
  return `## 💡 Demo Mode Active

I can see you've asked: *"${userMessage}"*

To get a real AI-powered response based on your document, please:

1. Click the **⚙️ Settings** button in the top-right corner
2. Enter your **Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com))
3. Click **Save** and try again

---

**What I would analyse:**
- Your document: **${state.documentName || 'Untitled document'}** (${state.documentText.length.toLocaleString()} characters)
- Your role: **${state.currentRole}**
- Your question: "${userMessage}"

---

> ⚠️ *JenLaw provides legal information, not legal advice. Always consult a qualified lawyer for decisions that could materially affect your rights.*`;
}

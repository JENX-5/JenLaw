// ── QA Prompt ──────────────────────────────────────────────────────────
const QA_PROMPT = `Answer the user's question using the supplied legal document.

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
Quote or paraphrase only the relevant provision.

**PLAIN-ENGLISH MEANING**
Explain the provision simply.

**SOURCE**
Provide the section, clause, paragraph, or page.

**WHAT IS UNCERTAIN**
Identify anything that cannot be determined.

**POSSIBLE NEXT QUESTION**
Suggest one useful question the user could investigate or discuss with a qualified legal professional when appropriate.`;

// ── Deep Extract prompt template ────────────────────────────────────────
const DEEP_EXTRACT_PROMPT = `Analyze the legal document provided below.

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
const PLAIN_ENGLISH_PROMPT = `Explain the following legal document in plain English.

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
Provide a brief explanation of what the document does.

B. WHAT THE USER IS AGREEING TO
Explain the user's major commitments.

C. WHAT THE OTHER PARTY AGREES TO
Explain the other party's major commitments.

D. MONEY
Explain important payments, fees, deposits, penalties, increases, and financial commitments.

E. TIME AND DEADLINES
Explain important dates, notice periods, renewals, and deadlines.

F. TERMINATION
Explain how how the agreement can end and what happens afterward.

G. IMPORTANT RESTRICTIONS
Explain confidentiality, intellectual property, non-compete, non-solicitation, assignment, or other restrictions.

H. DISPUTES
Explain how disagreements are supposed to be handled.

I. TERMS THAT NEED CAREFUL READING
Identify provisions that deserve particular attention.

For every explanation, distinguish clearly between:

* What the document says
* Your plain-English explanation
* Anything that remains uncertain

Do not add rights or obligations that do not appear in the document.
Do not claim that a clause is legally valid or invalid.
End with a brief disclaimer reminding the user this is legal information, not legal advice.`;

// ── Red Flags & Risks prompt template ──────────────────────────────
const RED_FLAGS_PROMPT = `Review the supplied legal document and identify provisions that deserve particular attention from the user.

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

For every finding provide:

\`\`\`json
{
"title": "",
"level": "",
"what_the_document_says": "",
"plain_english": "",
"why_it_matters": "",
"who_is_affected": "",
"source": "",
"uncertainty": ""
}
\`\`\`

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



const DEMO_RED_FLAGS = `## 🚩 Red Flags & Risks — Demo Mode

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

const ROLES = [
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

const HINT_MESSAGES = [
  'What does this document require me to do?',
  'Are there any automatic renewal clauses?',
  'What happens if I want to cancel early?',
  'Explain the liability and indemnification clauses.',
  'What are the most important things I should know?',
  'Is there a non-compete or confidentiality clause?',
];

// ── Demo responses (no API key) ──────────────────────────────────────────
const DEMO_RESPONSES = {
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
const DEMO_EXTRACT_JSON = {
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
const DEMO_PLAIN_ENGLISH = `## 📖 Plain English Explanation — Demo Mode

> *This is a demonstration response. Load a real document and add a Gemini API key in ⚙️ Settings to get a real analysis.*

---

## A. WHAT THIS DOCUMENT IS

**What the document says:** This is a Full-Time Employment Agreement between [Employer] and [Employee].

**In plain English:** This is a legal contract between you and a company that sets the terms of your job — what you’ll do, what you’ll be paid, and what rules you both agree to follow. By signing, you both become legally bound by its terms.

---

## B. WHAT THE USER IS AGREEING TO

**Clause 3.1 — Full-time commitment**
**What it says:** You agree to devote your full working time and attention to the Company.
**Plain English:** You cannot work another job while employed here, without permission.
**Conditions:** No exceptions are stated. This may apply outside working hours as well — the scope is unclear.

**Clause 8 — Confidentiality**
**What it says:** You must keep all Company information confidential, during and after employment.
**Plain English:** Even after you leave, you cannot share internal information, client lists, or business strategies with anyone outside the Company.
**Conditions:** This obligation survives termination with no stated time limit. Duration of confidentiality is not specified.

**Clause 10.1 — Non-compete**
**What it says:** For 12 months after leaving, you cannot work for a competitor within a 50-mile radius.
**Plain English:** After you quit or are fired, you may not take a similar role at a rival company for a full year, within a wide geographic area. Whether this is enforceable depends on your location.
**Uncertain:** Enforceability varies significantly by jurisdiction. A lawyer could advise whether this applies to you.

---

## C. WHAT THE OTHER PARTY AGREES TO

**Clause 4.1 — Salary**\`;

**What it says:** The Company agrees to pay your salary monthly.
**Plain English:** You will receive your pay once a month, as long as you remain employed.

**Clause 12.2 — Notice**
**What it says:** The Company must give you statutory notice or pay in lieu of notice if terminating your employment.
**Plain English:** They cannot simply stop your pay without warning. They must either give you advance notice or pay you for the notice period.

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

**Garden leave** *(Clause 12.5)*: During your notice period, the company can tell you to stay home and not work for anyone else. **Plain English:** Even after you resign, they may stop you from starting a new job for up to 1 month while paying your salary.

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

**Plain English:** If you have a problem, you’re expected to try to resolve it internally first. If that fails, there is an ACAS process before you can sue. This is standard for employment agreements in England.

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

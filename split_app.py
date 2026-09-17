import re

with open('app.js', 'r') as f:
    lines = f.read().split('\n')

blocks = []
current_block = {"header": "header", "lines": []}

for line in lines:
    if line.startswith('// ── '):
        if current_block["lines"]:
            blocks.append(current_block)
        current_block = {"header": line, "lines": [line]}
    else:
        current_block["lines"].append(line)
        
if current_block["lines"]:
    blocks.append(current_block)

files = {
    "src/js/state.js": [],
    "src/js/utils.js": [],
    "src/js/prompts.js": [],
    "src/js/api.js": [],
    "src/js/ui.js": [],
    "src/js/app.js": []
}

# Add QA_PROMPT to prompts.js manually
qa_prompt = """// ── QA Prompt ──────────────────────────────────────────────────────────
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
"""
files["src/js/prompts.js"].extend(qa_prompt.split('\n'))


for b in blocks:
    header = b["header"]
    text = '\n'.join(b["lines"])
    
    if "header" in header:
        # Before any headers, just top level consts. Let's look closely at the first block.
        # Actually first block is empty or has globals. Let's put it in app.js
        files["src/js/app.js"].extend(b["lines"])
    elif "Constants" in header:
        # Has JENLAW_SYSTEM_PROMPT and QUICK_ACTIONS. 
        # We need to manually split this block. Let's just put it in app.js for now, wait, JENLAW_SYSTEM_PROMPT is a prompt.
        files["src/js/app.js"].extend(b["lines"])
    elif "State" in header:
        files["src/js/state.js"].extend(b["lines"])
    elif "Utility" in header or "Simple Markdown" in header or "PDF.js" in header:
        files["src/js/utils.js"].extend(b["lines"])
    elif "Gemini API" in header or "Gemini raw call" in header:
        files["src/js/api.js"].extend(b["lines"])
    elif "prompt template" in header or "Demo " in header:
        files["src/js/prompts.js"].extend(b["lines"])
    elif "UI:" in header or "modal" in header or "Extract Panel Renderer" in header or "View navigation" in header or "Sidebar toggle" in header:
        files["src/js/ui.js"].extend(b["lines"])
    else:
        files["src/js/app.js"].extend(b["lines"])

for path, flines in files.items():
    with open(path, 'w') as f:
        f.write('\n'.join(flines))
        
print("Split complete.")

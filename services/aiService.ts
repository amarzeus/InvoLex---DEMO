





import { GoogleGenAI, Type } from "@google/genai";
import { Email, AnalyticsData, AnalyticsInsight, Correction, AIPreview, Matter, EmailTriageResult, TriageStatus, AlternativeMattersResult, SuggestedBillingRule, BillingRule, BillableEntry, AIPersona } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This is a client-side simulation, so we'll use a placeholder if the key isn't set.
  // In a real backend, this would throw a fatal error.
  console.warn("API_KEY is not defined. Using a placeholder.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "DUMMY_API_KEY_FOR_CLIENT_SIMULATION" });


// --- AI "EDGE FUNCTION" SIMULATION ---
// All Gemini logic is contained here, representing a secure backend.

const formatCorrectionExamples = (corrections: Correction[]): string => {
  if (corrections.length === 0) return "No examples provided.";
  return corrections.slice(0, 5).map(c => 
`---
EMAIL CONTEXT: "${c.emailBody.substring(0, 200)}..."
ORIGINAL SUGGESTION: "${c.originalDescription}"
USER'S PREFERRED FORMAT: "${c.correctedDescription}"
---`).join('\n');
}

const formatExternalEntryContext = (entries: BillableEntry[]): string => {
    if (entries.length === 0) return "No recent external entries.";
    return entries.map(e => `- On ${new Date(e.date).toLocaleDateString()}, billed ${e.hours}h to "${e.matter}" for: "${e.description}"`).join('\n');
};


export const aiService = {
  async generateOrRefineEmailDraft(params: {
    action: 'draft' | 'refine';
    instruction: string;
    persona: AIPersona;
    emailBody: string | null;
    currentDraft: string | null;
    matters: Matter[];
  }): Promise<string> {
      const { action, instruction, persona, emailBody, currentDraft } = params;
  
      const personaInstructions = {
          [AIPersona.FormalPartner]: "You are a senior partner at a prestigious law firm. Your tone is formal, authoritative, and direct. You use sophisticated legal vocabulary but ensure clarity.",
          [AIPersona.NeutralAssociate]: "You are an associate lawyer. Your tone is professional, neutral, and clear. You are helpful and objective in your communications.",
          [AIPersona.ConciseSeniorCounsel]: "You are a seasoned senior counsel. Your top priority is brevity and getting to the point. Your tone is professional and highly efficient, avoiding unnecessary pleasantries.",
          [AIPersona.AccommodatingColleague]: "You are a friendly and accommodating colleague. Your tone is professional yet warm and collaborative. You aim to find solutions and maintain good relationships."
      };
  
      const systemInstruction = personaInstructions[persona];
  
      const prompt = action === 'draft'
        ? `An instruction for an email draft has been provided. Create a complete, professional email based on the user's instruction. If an original email is provided, the draft should be a logical response.
          **Context - Previous Email:**
          """
          ${emailBody || "N/A - This is a new email."}
          """
          **User's Instruction:**
          """
          ${instruction}
          """
          Generate ONLY the body of the email draft. Do not include a subject line. Do not sign the email.`
        : `An existing email draft needs to be refined. Apply the user's refinement instruction to the "Current Draft".
          **Refinement Instruction:** "${instruction}"
          **Current Draft:**
          """
          ${currentDraft}
          """
          Generate ONLY the new, refined email body.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        }
      });
  
      return response.text.trim();
  },

  async analyzeCorrectionsForRules(corrections: Correction[], existingRules: BillingRule[], matters: Matter[]): Promise<SuggestedBillingRule | null> {
    if (corrections.length < 3) return null; // Don't run on too few corrections
    const matterNames = matters.map(m => m.name).join(', ');

    const prompt = `You are a legal tech system administrator AI. Your goal is to find automation opportunities by analyzing a user's recent corrections to billable entries. You will suggest ONE new billing rule to save the user time.

RULES:
1.  Analyze the provided correction history to identify a clear, recurring pattern.
2.  Focus on simple, high-impact patterns:
    *   An email from a specific sender/domain is consistently changed to the same matter.
    *   An email containing a specific keyword is consistently changed to a specific matter or has its hours adjusted.
    *   An email from a specific sender/domain is consistently being marked as non-billable (description changed to something like "non-billable").
3.  Formulate a single \`BillingRule\` object that would automate this pattern.
4.  Do NOT suggest a rule that is functionally identical to an existing rule.
5.  Determine the most appropriate 'targetMatterName' for this new rule from the provided list of matters.
6.  Provide a concise, user-friendly justification explaining WHY this rule is being suggested.
7.  For the rule's actionValue, always return it as a string, e.g., "0.25", "true", "example.com".
8.  If no strong, clear pattern is found, return null in the JSON response.

**Correction History (User's Recent Edits):**
${JSON.stringify(corrections.slice(0, 10), null, 2)}

**Existing Rules (to avoid duplicates):**
${JSON.stringify(existingRules, null, 2)}

**Available Matters:**
${matterNames}

Respond with a single JSON object. The root property should be 'suggestion'. If a rule is found, 'suggestion' will be an object with 'justification', 'rule', and 'targetMatterName'. If no rule is found, 'suggestion' should be null.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                justification: { type: Type.STRING },
                targetMatterName: { type: Type.STRING },
                rule: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    actionType: { type: Type.STRING },
                    actionValue: { type: Type.STRING },
                    conditions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          value: { type: Type.STRING },
                        },
                        required: ["type", "value"]
                      }
                    }
                  },
                  required: ["id", "actionType", "actionValue", "conditions"]
                }
              },
              required: ["justification", "rule", "targetMatterName"]
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result.suggestion || null;
  },
  
  async generateLiveBillableEntry(originalEmailContent: string, draftContent: string, matters: Matter[]): Promise<AIPreview> {
    const matterNames = matters.map(m => m.name).join(', ');

    const prompt = `You are an ultra-fast AI legal assistant. Your task is to generate a billable entry in real-time as a lawyer drafts an email. Be extremely concise and quick.

**Context:**
- Original Email (if replying): "${originalEmailContent ? originalEmailContent.substring(0, 300) + '...' : 'N/A (This is a new email).'}"
- Lawyer's Draft Email: "${draftContent}"

**Rules:**
1.  **Description:** Create a 1-sentence, past-tense summary of the work being done in the draft (e.g., "Drafted new email to client regarding discovery deadlines."). The description MUST start with an action verb. If replying, it should reflect the reply (e.g., "Drafted response...").
2.  **Matter:** Pick the most likely matter from the list.
3.  **Hours:** Estimate a reasonable time. Start low (0.1) and increase slightly as the draft gets longer. A few sentences is 0.1-0.2. A long, detailed reply might be 0.3-0.5.

**Available Matters**: ${matterNames}

Return a single, clean JSON object. Do not add any extra commentary.
`;

    // Disable thinking for low latency
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedMatter: { type: Type.STRING },
            suggestedHours: { type: Type.NUMBER },
          },
          required: ['description', 'suggestedMatter', 'suggestedHours'],
        },
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    // We only need a subset of AIPreview for this live feature
    const result = JSON.parse(response.text.trim());
    return {
        ...result,
        actionItems: [],
        detailedBreakdown: [],
    };
  },

  async triageEmail(emailContent: string, matters: Matter[], corrections: Correction[], externalEntries: BillableEntry[]): Promise<EmailTriageResult> {
    const matterNames = matters.map(m => m.name).join(', ');
    const prompt = `You are an expert legal assistant. Your task is to first determine if an email contains substantive, billable legal work. Then, if it IS billable, you must generate a draft billable entry for it.

**Rules for Triage:**
1.  **Billable work involves:** Legal analysis, strategy, document review/drafting, substantive communication with clients/counsel/experts.
2.  **Non-billable work includes:** Scheduling, administrative tasks, confirmations, spam, newsletters, or purely personal messages.
3.  **Check for Duplicates:** Review the "Recent External Billings". If the email content seems to be directly related to an entry already logged on the same day for the same matter, flag it as a suspected duplicate.
4.  Provide a brief, clear reason for your decision.

**Rules for Billable Entry Generation (only if billable and not a duplicate):**
- **Description:** A single, past-tense sentence starting with an action verb (e.g., "Reviewed...", "Analyzed...", "Drafted...").
- **Matter:** Choose the most relevant from the provided list.
- **Detailed Breakdown:** Create a bullet-point list of the specific sub-tasks or points covered in the email. This provides justification for the work.
- **Action Items:** Extract specific, forward-looking tasks.
- **Hours:** Estimate a reasonable time (e.g., 0.1, 0.2, 0.5).
- **Confidence Score:** Provide a score from 0.0 to 1.0 indicating your confidence that the entry is accurate and complete. High confidence (0.9+) means the matter is obvious and the work is clear. Low confidence (<0.7) means it's ambiguous.
- **Confidence Justification:** Briefly explain your confidence score.

**LEARNING EXAMPLES (learn from these user corrections for entry generation):**
${formatCorrectionExamples(corrections)}

**Recent External Billings (for context, avoid duplicates):**
${formatExternalEntryContext(externalEntries)}

**List of Available Matters**: ${matterNames}

**Email Content to Analyze**:
"""
${emailContent}
"""

Respond with a single JSON object. The root property must be 'decision' ("BILLABLE", "NOT_BILLABLE", "DUPLICATE_SUSPECTED"). Include 'reason'. If 'decision' is "BILLABLE", the 'preview' object must be populated.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING, enum: [TriageStatus.BILLABLE, TriageStatus.NOT_BILLABLE, TriageStatus.DUPLICATE_SUSPECTED] },
            reason: { type: Type.STRING, description: "A brief justification for the decision." },
            preview: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                suggestedMatter: { type: Type.STRING },
                actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                detailedBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedHours: { type: Type.NUMBER },
                justification: {
                  type: Type.OBJECT,
                  properties: {
                    matter: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['matter', 'description']
                },
                confidenceScore: { type: Type.NUMBER },
                confidenceJustification: { type: Type.STRING },
              },
              required: ['description', 'suggestedMatter'],
            }
          },
          required: ['decision', 'reason'],
        },
      },
    });

    const result = JSON.parse(response.text.trim());

    return {
        status: result.decision,
        reason: result.reason,
        preview: result.preview,
      };
  },
  
  async groupAndSummarizeEmails(emails: Email[], matters: Matter[], corrections: Correction[], externalEntries: BillableEntry[]): Promise<{ emailIds: string[], preview: AIPreview }[]> {
    if (emails.length === 0) return [];
    const matterNames = matters.map(m => m.name).join(', ');

    const prompt = `You are an expert legal assistant. Your primary task is to analyze a batch of emails, group them into logical conversation threads or tasks, and generate a single, consolidated billable entry for each group.

**Grouping Logic:**
- Group emails with the same subject line (especially with "Re:", "Fwd:").
- Group emails that discuss the same specific task, even if subjects differ slightly.
- Do NOT group unrelated emails. If an email is billable but standalone, create a group of one for it.
- Ignore non-billable emails (spam, scheduling, etc.).
- **AVOID DUPLICATES**: Check the 'Recent External Billings'. If a group of emails appears to cover work already logged externally, do not create a suggestion for it.

**Consolidated Entry Rules (for each group):**
1.  **description**: Write a single, concise, past-tense sentence summarizing the entire group's activity (e.g., "Corresponded with client regarding settlement offer and analyzed attached documents.").
2.  **suggestedMatter**: Pick the single best matter from the list.
3.  **suggestedHours**: Estimate the TOTAL time for all work in the group. Be realistic.
4.  **actionItems/detailedBreakdown**: Consolidate these from all emails in the group.
5.  **confidenceScore**: Provide a single score from 0.0 to 1.0 for the entire consolidated entry.
6.  **confidenceJustification**: Briefly explain the confidence score for the group.

**LEARNING EXAMPLES (for entry style):**
${formatCorrectionExamples(corrections)}

**Recent External Billings (for context, avoid duplicates):**
${formatExternalEntryContext(externalEntries)}

**Available Matters**: ${matterNames}

**Emails to Analyze (JSON):**
${JSON.stringify(emails.map(e => ({ id: e.id, subject: e.subject, body: `"""${e.body.substring(0, 400)}..."""` })), null, 2)}

**Final Output:**
Return a JSON array of suggestion objects. Each object must contain 'emailIds' (an array of all email IDs in the group) and a 'preview' object containing the consolidated entry details.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        emailIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        preview: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                suggestedMatter: { type: Type.STRING },
                                actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                                detailedBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                                suggestedHours: { type: Type.NUMBER },
                                justification: {
                                    type: Type.OBJECT,
                                    properties: {
                                        matter: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    },
                                    required: ['matter', 'description']
                                },
                                confidenceScore: { type: Type.NUMBER },
                                confidenceJustification: { type: Type.STRING },
                            },
                             required: ['description', 'suggestedMatter', 'suggestedHours'],
                        }
                    },
                    required: ['emailIds', 'preview']
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
  },

  async generateBillableEntriesFromEmails(emails: Email[], matters: Matter[], corrections: Correction[]): Promise<any[]> {
     if (emails.length === 0) return [];
     const matterNames = matters.map(m => m.name);
     const prompt = `You are an automated legal assistant running in "Auto-Pilot" mode. Your job is to analyze a batch of emails and automatically create billable entry drafts.

      **LEARNING EXAMPLES (learn from these user corrections):**
      ${formatCorrectionExamples(corrections)}
      
      **List of Available Matters**: ${matterNames.join(', ')}
      
      **Emails to Analyze (in JSON format)**:
      ${JSON.stringify(emails.map(e => ({ id: e.id, subject: e.subject, body: e.body })), null, 2)}
      
      For each email that contains billable work, generate a JSON object with the required fields.
      - Provide a 'confidenceScore' from 0.0 to 1.0 indicating your confidence that the entry is accurate and complete. High confidence (0.9+) means the matter is obvious and the work is clear. Low confidence (<0.7) means it's ambiguous.
      - Also provide a brief 'confidenceJustification'.
      - Ignore non-billable emails.
      
      Your primary output should be a JSON array of these objects for the billable emails.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                emailId: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedMatter: { type: Type.STRING },
                suggestedHours: { type: Type.NUMBER },
                actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                detailedBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                confidenceScore: { type: Type.NUMBER },
                confidenceJustification: { type: Type.STRING },
              },
              required: ['emailId', 'description', 'suggestedMatter', 'suggestedHours', 'confidenceScore', 'confidenceJustification'],
            },
          },
        },
      });
      return JSON.parse(response.text.trim());
  },

  async generateAnalyticsInsights(analyticsData: AnalyticsData): Promise<AnalyticsInsight> {
      const prompt = `You are a legal productivity analyst for a law firm. Given the following data on billable hours and revenue, provide 2-3 actionable, insightful observations. Focus on trends, outliers, or potential areas for improvement. Be concise and data-driven.

      **Data:**
      ${JSON.stringify(analyticsData, null, 2)}
      
      Provide your response as a JSON object with an "insights" array of strings.`;
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.5,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: { insights: { type: Type.ARRAY, items: { type: Type.STRING } } },
              required: ['insights'],
            },
          },
        });
      return JSON.parse(response.text.trim());
  },

  async refineDescriptionWithAI(currentDescription: string, instruction: string, emailBody: string): Promise<string> {
    const prompt = `You are a writing assistant. A user wants to refine a billable entry description based on an instruction.
    
    **Email Context:**
    """
    ${emailBody}
    """
    
    **Current Description:** "${currentDescription}"
    **User's Instruction:** "${instruction}"
    
    Rewrite the description according to the user's instruction, while keeping it concise and grounded in the email context. Return only the refined description in a JSON object.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: { refinedDescription: { type: Type.STRING } },
            required: ['refinedDescription'],
          },
        },
      });
      const result = JSON.parse(response.text.trim());
      return result.refinedDescription;
  },

  async suggestAlternativeMatters(emailContent: string, matters: Matter[], currentSuggestedMatter: string): Promise<AlternativeMattersResult> {
    const matterNames = matters.map(m => m.name).filter(name => name !== currentSuggestedMatter);
    if (matterNames.length === 0) return { suggestions: [] };

    const prompt = `You are an expert legal categorizer. Your task is to analyze the provided email and suggest the top 3 most relevant legal matters, excluding the current suggestion.

**Rules:**
- Choose from the "List of Available Alternatives".
- For each suggestion, provide a "High" or "Medium" confidence level.
- For each, provide a very brief (1 sentence) justification for your choice.
- If you can't find any good alternatives, return an empty array.

**List of Available Alternatives**: ${matterNames.join(', ')}
**Email Content to Analyze**:
"""
${emailContent}
"""

Now, generate the JSON output.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  matter: { type: Type.STRING, description: "An alternative matter from the provided list." },
                  confidence: { type: Type.STRING, enum: ["High", "Medium"], description: "The confidence level of the suggestion." },
                  justification: { type: Type.STRING, description: "A brief reason for suggesting this matter." }
                },
                required: ["matter", "confidence", "justification"]
              }
            }
          },
          required: ["suggestions"]
        },
      },
    });
    return JSON.parse(response.text.trim());
  },
};
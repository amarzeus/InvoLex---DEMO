

import { GoogleGenAI, Type, GenerateContentResponse, Content } from "@google/genai";
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
  async runAssistantChat(history: Content[], tools: any[]): Promise<GenerateContentResponse> {
      const systemInstruction = `You are InvoLex Assistant, a helpful AI integrated into a legal billing application.
      Your capabilities are defined by the tools you have access to.
      - When asked to perform an action (like creating or searching entries), you MUST use the provided tools.
      - When asked for a summary or data, use the get_summary_data tool.
      - When asked a general question, you can answer conversationally.
      - When creating a manual entry, you must confirm the details (description, hours, matter, date) with the user if any are missing from the prompt.
      - Be concise and professional.
      - Today's date is ${new Date().toLocaleDateString('en-CA')}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
        // FIX: The 'tools' property should be inside the 'config' object.
        config: {
            tools: [{ functionDeclarations: tools }],
            systemInstruction: systemInstruction,
        }
      });

      return response;
  },

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
[${matterNames}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
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
                    },
                  },
                },
              },
            },
          },
        }
    });

    try {
        const jsonText = response.text.trim();
        if (jsonText.toLowerCase().includes('null')) return null;
        const suggestion = JSON.parse(jsonText) as SuggestedBillingRule;
        // Basic validation
        if (suggestion.justification && suggestion.rule && suggestion.targetMatterName) {
            return suggestion;
        }
        return null;
    } catch (error) {
        console.error("Error parsing rule suggestion:", error);
        return null;
    }
  },

  async refineDescriptionWithAI(originalDescription: string, instruction: string, emailBody: string): Promise<string> {
    const prompt = `A user wants to refine a billable entry description based on the original email content.
    
    **Original Email Content (for context):**
    """
    ${emailBody}
    """
    
    **Current Description:**
    "${originalDescription}"
    
    **User's Refinement Instruction:**
    "${instruction}"
    
    Generate a new, improved description that incorporates the user's instruction while staying true to the email's content. Output only the refined description text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.5,
        }
    });

    return response.text.trim();
  },

  async suggestAlternativeMatters(emailBody: string, matters: Matter[], currentSuggestion: string): Promise<AlternativeMattersResult> {
    const matterList = matters.map(m => `"${m.name}"`).join(', ');
    const prompt = `Based on the email content, suggest up to two alternative "matters" from the provided list that could also be relevant. For each suggestion, provide a brief justification and a confidence level (High or Medium). Do not suggest the "currentSuggestion".
    
    **Email Content:**
    """
    ${emailBody}
    """
    
    **Available Matters:**
    [${matterList}]
    
    **Current AI Suggestion (Exclude this from your response):**
    "${currentSuggestion}"
    
    Provide the response in the specified JSON format.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    matter: { type: Type.STRING, description: 'The name of the suggested matter.' },
                    confidence: { type: Type.STRING, description: 'High or Medium' },
                    justification: { type: Type.STRING, description: 'Why this matter might be a good fit.' },
                  },
                },
              },
            },
          },
        }
    });

    return JSON.parse(response.text);
  },
  
  async generateLiveBillableEntry(emailContext: string, draftText: string, matters: Matter[]): Promise<AIPreview> {
    if (!draftText.trim()) {
        return { description: '', suggestedMatter: '', suggestedHours: 0 };
    }
    const matterNames = matters.map(m => m.name).join(', ');

    const prompt = `Analyze the user's email draft in the context of the original email (if any) to generate a live billable entry preview.
    1.  Create a concise, one-sentence description for a billable entry.
    2.  Suggest the most likely matter from the provided list.
    3.  Estimate billable hours (e.g., 0.1, 0.2). Default to 0.2 if unsure.
    4.  The output must be a valid JSON object.
    
    **Original Email (for context):**
    """
    ${emailContext || 'N/A - This is a new email chain.'}
    """
    
    **User's Current Draft:**
    """
    ${draftText}
    """
    
    **Available Matters:**
    [${matterNames}]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    suggestedMatter: { type: Type.STRING },
                    suggestedHours: { type: Type.NUMBER },
                }
            },
            temperature: 0.1,
        }
    });

    try {
        return JSON.parse(response.text);
    } catch {
        return { description: '', suggestedMatter: '', suggestedHours: 0 };
    }
  },

  async groupAndSummarizeEmails(emails: Email[], matters: Matter[], corrections: Correction[], externalEntries: BillableEntry[]): Promise<{ emailIds: string[], preview: AIPreview }[]> {
      const prompt = `You are an expert legal assistant AI. Your task is to analyze a batch of emails and group them into threads or related topics that represent a single billable event.
      
      **Instructions:**
      1.  **Group Emails:** Identify emails that are part of the same conversation (e.g., replies, forwards) or discuss the exact same specific legal issue. Create a group for each distinct billable event. An email should only belong to one group.
      2.  **Analyze Each Group:** For each group you create:
          a.  Write a concise, one-sentence billable entry description in the past tense (e.g., "Reviewed and analyzed discovery documents...").
          b.  Suggest the most appropriate "matter" from the provided list.
          c.  Estimate the billable hours (e.g., 0.2, 0.5, 1.0).
          d.  Extract up to 3 specific, actionable tasks for the user (e.g., "Follow up with client," "Draft response brief").
          e.  Provide a detailed, bulleted breakdown of the work performed.
          f.  Calculate a confidence score (0.0 to 1.0) for how certain you are that this is a valid, billable entry.
          g.  Provide a brief justification for your confidence score.
      3.  **Use Context:** Use the provided examples of user corrections and recent external entries to match the user's preferred style and terminology.
      4.  **Format Output:** Return an array of JSON objects, one for each group identified.

      **User Correction Examples (to learn style):**
      ${formatCorrectionExamples(corrections)}

      **Recent External Entries (for context on current work):**
      ${formatExternalEntryContext(externalEntries)}
      
      **Available Matters:**
      [${matters.map(m => m.name).join(', ')}]
      
      **Emails to Process:**
      ${JSON.stringify(emails.map(e => ({id: e.id, subject: e.subject, body: e.body.substring(0, 500)})))}
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      groups: {
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
                                          suggestedHours: { type: Type.NUMBER },
                                          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                                          detailedBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                                          confidenceScore: { type: Type.NUMBER },
                                          confidenceJustification: { type: Type.STRING },
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      });
      
      try {
          const result = JSON.parse(response.text);
          return result.groups || [];
      } catch (e) {
          console.error("Error parsing grouped suggestions:", e);
          return [];
      }
  },

  async triageEmail(emailBody: string, matters: Matter[], corrections: Correction[], externalEntries: BillableEntry[]): Promise<EmailTriageResult> {
    const matterNames = matters.map(m => m.name).join(', ');
    const prompt = `You are an expert legal assistant AI. Triage this email to determine if it represents billable work.
      1.  **Analyze Content:** Read the email and decide if it's billable, non-billable, or a suspected duplicate of existing work.
      2.  **Billable Work:** If billable, generate a complete AIPreview object. Be detailed.
          - Description: A concise, one-sentence summary in past tense.
          - Matter: Suggest the most likely matter.
          - Hours: Estimate billable hours (e.g., 0.2, 0.3).
          - Action Items: Extract up to 3 specific tasks for the user.
          - Detailed Breakdown: Provide a bulleted list of the work performed.
          - Confidence Score: A score from 0.0 to 1.0.
          - Justification: Explain your reasoning for the matter, summary, and confidence.
      3.  **Non-Billable/Duplicate Work:** If not billable (e.g., newsletter, personal) or a likely duplicate, set \`status\` to "NOT_BILLABLE" or "DUPLICATE_SUSPECTED" and provide a brief \`reason\`.
      4.  **Use Context:** Use the provided correction examples and recent entries to match the user's style and identify duplicate work.
      
      **User Correction Examples (Learn their style):**
      ${formatCorrectionExamples(corrections)}

      **Recent External Entries (Check for duplicates):**
      ${formatExternalEntryContext(externalEntries)}
      
      **Available Matters:**
      [${matterNames}]
      
      **Email to Triage:**
      """
      ${emailBody}
      """
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: `Enum: ${Object.values(TriageStatus).join(', ')}` },
              reason: { type: Type.STRING, description: 'Required if status is NOT_BILLABLE or DUPLICATE_SUSPECTED.' },
              preview: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  suggestedMatter: { type: Type.STRING },
                  suggestedHours: { type: Type.NUMBER },
                  actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  detailedBreakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                  justification: {
                    type: Type.OBJECT,
                    properties: {
                      matter: { type: Type.STRING },
                      description: { type: Type.STRING },
                    }
                  },
                  confidenceScore: { type: Type.NUMBER },
                  confidenceJustification: { type: Type.STRING },
                }
              }
            }
          }
        }
      });
      
      return JSON.parse(response.text);
  },

  async generateBillableEntriesFromEmails(emails: Email[], matters: Matter[], corrections: Correction[]): Promise<{emailId: string, description: string, suggestedMatter: string, suggestedHours: number, confidenceScore: number}[]> {
    const prompt = `
    Analyze the following emails. For each email that contains billable work, create a JSON object with a concise description, suggested matter, and suggested hours.
    
    RULES:
    - If an email is not billable (e.g., spam, newsletter, personal), do not create an object for it.
    - Base your suggestions on the provided matter list and user correction examples.
    - Descriptions should be professional and in the past tense.
    - Provide a confidence score (0.0 to 1.0) for each entry.

    **Available Matters:**
    [${matters.map(m => m.name).join(', ')}]

    **User Correction Examples (to learn style):**
    ${formatCorrectionExamples(corrections)}

    **Emails to process:**
    ${JSON.stringify(emails.map(e => ({id: e.id, body: e.body, subject: e.subject})))}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              entries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    emailId: { type: Type.STRING },
                    description: { type: Type.STRING },
                    suggestedMatter: { type: Type.STRING },
                    suggestedHours: { type: Type.NUMBER },
                    confidenceScore: { type: Type.NUMBER },
                  },
                },
              },
            },
          },
        }
    });

    const result = JSON.parse(response.text);
    return result.entries || [];
  },

  async generateAnalyticsInsights(data: AnalyticsData): Promise<AnalyticsInsight> {
    const prompt = `
    Analyze the following billing data and generate 2-3 concise, actionable insights for a lawyer.
    Focus on productivity, revenue trends, and potential areas for improvement.
    
    Data:
    - Hours by Matter: ${JSON.stringify(data.hoursByMatter)}
    - Monthly Revenue: ${JSON.stringify(data.revenueByMonth)}
    - Entry Statuses: ${JSON.stringify(data.entriesByStatus)}
    
    Generate insights as a JSON object with an "insights" array of strings.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        }
    });
    return JSON.parse(response.text);
  },
};
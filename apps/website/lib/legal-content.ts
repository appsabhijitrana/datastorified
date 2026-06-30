export type PolicyIcon = "privacy" | "terms" | "cookies" | "disclaimer" | "ai" | "security" | "community" | "acceptable" | "sources" | "copyright" | "accessibility";

export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPolicy = {
  slug: string;
  title: string;
  description: string;
  effectiveDate: string;
  lastUpdated: string;
  icon: PolicyIcon;
  sections: PolicySection[];
  related: string[];
};

export const POLICY_EFFECTIVE_DATE = "30 June 2026";
export const POLICY_UPDATED_DATE = "30 June 2026";
export const LEGAL_TEMPLATE_NOTICE = "This document is provided as a platform policy template and should be reviewed by qualified legal counsel before relying on it as legal advice.";
export const CONTACT_URL = "https://datastorified.com/contact";

const section = (id: string, title: string, paragraph: string, bullets?: string[]): PolicySection => ({ id, title, paragraphs: [paragraph], bullets });
const policy = (value: Omit<LegalPolicy, "effectiveDate" | "lastUpdated">): LegalPolicy => ({ ...value, effectiveDate: POLICY_EFFECTIVE_DATE, lastUpdated: POLICY_UPDATED_DATE });

export const legalPolicies: LegalPolicy[] = [
  policy({
    slug: "privacy", title: "Privacy Policy", icon: "privacy",
    description: "How DataStorified collects, uses, stores, and protects information across its decision engine, calculators, tools, AI features, and local workspace.",
    related: ["cookies", "security", "ai-disclosure", "data-sources"],
    sections: [
      section("introduction", "1. Introduction", "This Privacy Policy explains how DataStorified (\"DataStorified,\" \"we,\" \"us,\" or \"our\") handles information when you use our websites, decision experiences, calculators, utilities, and future account or paid features. It applies to all DataStorified-operated services unless a feature presents a more specific notice."),
      section("information-we-collect", "2. Information we collect", "We collect only information reasonably needed to operate, secure, improve, and understand the service. The categories depend on whether you browse anonymously, use a local tool, submit a contact request, upload a file, or later create an optional account.", ["Information you intentionally submit", "Basic device, request, and usage information", "Local workspace data stored in your browser", "Information generated when optional AI or cloud features are used"]),
      section("information-users-provide", "3. Information users provide", "You may provide contact details, support messages, feedback, account profile information, preferences, user content, or payment-related details for future paid services. Payment card data should be handled directly by an authorized payment processor rather than stored by DataStorified."),
      section("automatically-collected", "4. Automatically collected information", "Our hosting and security providers may receive IP address, browser and device type, referring page, requested URL, timestamps, approximate region, error information, and security signals. We use this data for delivery, abuse prevention, troubleshooting, and aggregated product measurement."),
      section("local-storage", "5. Local storage and device storage", "Phase 1 saves recent items, favorites, search history, preferences, and calculator drafts in browser local storage using `ds.*` keys. This data normally remains on your device, is available to anyone using the same browser profile, and may disappear when browser data is cleared or private browsing ends."),
      section("cookies", "6. Cookies", "We currently prefer local, client-side storage and may use essential cookies for security, session continuity, load balancing, or future optional authentication. Non-essential analytics or advertising cookies will require an appropriate notice and consent where applicable."),
      section("analytics", "7. Analytics", "Phase 1 analytics are a development-safe event facade. If production analytics are enabled, we will aim to collect minimized, aggregated usage events such as page visits, searches, feature use, and errors; we will update this policy and consent controls before introducing materially different tracking."),
      section("ai-feature-usage", "8. AI feature usage", "When an AI-backed feature is introduced, prompts, relevant context, generated output, safety signals, and feedback may be processed to provide the result and prevent abuse. The interface will identify when information is sent to an external AI provider and will avoid silently treating local-only inputs as AI prompts."),
      section("calculator-tool-inputs", "9. Calculator and tool inputs", "Calculations and supported text transformations are designed to run in your browser. Unless a feature clearly says otherwise, we do not receive the values, text, or drafts you enter. You should still avoid entering secrets or regulated data on shared or untrusted devices."),
      section("uploaded-files", "10. Uploaded files", "Phase 1 file tools are non-processing demonstrations and do not upload files. Future file features will disclose whether processing occurs locally or remotely, what is transmitted, how long temporary files remain, and what deletion controls are available before a file is selected."),
      section("how-we-use", "11. How we use information", "We use information to provide and personalize requested features, maintain local or cloud preferences, respond to inquiries, secure the service, investigate abuse, meet legal obligations, measure reliability, improve usability, and communicate material service or policy changes."),
      section("how-we-share", "12. How we share information", "We do not sell personal information. We may share limited information with contracted infrastructure, analytics, communications, payment, authentication, or AI providers; professional advisers; authorities where lawfully required; or a successor in a properly structured business transaction."),
      section("third-party-services", "13. Third-party services", "Vercel and domain, analytics, payment, authentication, AI, or data providers may process information under their own terms. We select providers with relevant safeguards where practical, but their independent services and privacy practices are not controlled by this policy."),
      section("retention", "14. Data retention", "Local workspace data remains until you remove it, clear site data, or the browser removes it. Server-side records, if introduced, will be retained only as long as needed for the stated purpose, security, dispute resolution, accounting, or legal compliance, then deleted or de-identified."),
      section("choices-rights", "15. User choices, data rights, and grievances", `You can clear local storage through browser settings and decline optional features that require data transfer. Depending on applicable law, you may request access, correction, completion, updating, deletion, restriction, portability, objection, or withdrawal of consent through ${CONTACT_URL}. You may also raise a privacy grievance or, where applicable, nominate another individual to exercise rights in the event of death or incapacity. Identity and authority verification may be required before we act.`),
      section("children", "16. Children’s privacy", "DataStorified is not directed to children under 13, or a higher minimum age where local law requires it, and we do not knowingly collect their personal information. A parent or guardian who believes a child submitted information should contact us for review and deletion."),
      section("security", "17. Security", "We use proportionate technical and organizational safeguards, including reputable managed infrastructure, encrypted transport, limited access, dependency maintenance, and a responsible disclosure channel. No internet, browser, or storage system can guarantee absolute security."),
      section("international", "18. International users", "DataStorified and its providers may process information in countries other than yours. Where required, we will use recognized transfer mechanisms and contractual safeguards; users remain responsible for confirming that the service is appropriate in their jurisdiction."),
      section("changes", "19. Changes to this policy", "We may revise this policy as products, providers, or laws change. We will update the date above and provide additional notice for material changes when reasonably required; continued use after an effective change means the revised policy applies."),
      section("contact", "20. Contact", `Use the official contact page at ${CONTACT_URL} for privacy questions and rights requests. Select Privacy or Legal and include enough detail to identify the service and request. Do not submit passwords, financial credentials, health records, or unnecessary sensitive information.`),
    ],
  }),
  policy({
    slug: "terms", title: "Terms of Service", icon: "terms",
    description: "The rules governing access to and use of DataStorified services, content, calculators, utilities, and future paid features.",
    related: ["acceptable-use", "disclaimer", "ai-disclosure", "copyright"],
    sections: [
      section("acceptance", "1. Acceptance of terms", "By accessing or using DataStorified, you agree to these Terms and incorporated policies. If you do not agree, do not use the service. A person using the service for an organization confirms authority to bind that organization."),
      section("service", "2. Description of service", "DataStorified provides decision-support experiences, calculators, browser utilities, local workspace features, educational content, and future optional accounts, creator products, APIs, and paid services. Features may be experimental, labelled as demos, or changed over time."),
      section("eligibility", "3. Eligibility", "You must be legally capable of entering these Terms and meet the minimum digital-consent age in your jurisdiction. Users under the age of majority should use the service only with permission and appropriate supervision."),
      section("accounts", "4. Accounts", "Exploration does not require an account in Phase 1. If accounts are introduced, you must provide accurate information, protect credentials, promptly report unauthorized access, and remain responsible for activity performed through your account."),
      section("responsibilities", "5. User responsibilities", "You are responsible for your inputs, assumptions, device security, interpretation of results, compliance with law, and independent verification before acting. Do not submit data you lack permission to use or expose confidential information unnecessarily."),
      section("calculators-tools", "6. Calculator and tool usage", "Calculators and utilities provide estimates or transformations based on the inputs and simplified methods displayed. Results can be affected by rounding, outdated assumptions, browser behavior, local rules, or incomplete information and should be checked against authoritative sources."),
      section("decision-engine", "7. Decision Engine usage", "Decision Engine outputs organize trade-offs and suggest questions or resources; they do not know every fact about your circumstances. You retain control of the decision and must assess risks, alternatives, and professional obligations."),
      section("ai-output", "8. AI-generated outputs", "AI content may be incomplete, biased, outdated, inconsistent, or incorrect. It may resemble existing material and should not be represented as verified fact, professional judgment, or exclusively original work without appropriate review."),
      section("professional-advice", "9. No professional advice", "DataStorified does not provide financial, investment, legal, tax, medical, accounting, engineering, or other regulated professional advice. Consult a qualified professional who can evaluate your complete situation before making consequential decisions."),
      section("user-content", "10. User content", "You retain ownership of content you submit. You grant us only the limited rights necessary to process, display, transmit, secure, and improve the requested service, subject to product disclosures and privacy commitments. You confirm you have all required rights."),
      section("intellectual-property", "11. Intellectual property", "The DataStorified name, interface, software, design, documentation, and original content are owned by DataStorified or its licensors and protected by applicable law. These Terms grant a limited, revocable, non-transferable right to use the service as intended."),
      section("prohibited-uses", "12. Prohibited uses", "You may not use the service unlawfully; harm people or systems; distribute malware or spam; infringe rights; impersonate others; manipulate access controls; overload infrastructure; scrape abusively; or reverse engineer restricted components except where law expressly permits."),
      section("third-parties", "13. Third-party services", "Links, datasets, APIs, payment processors, hosting providers, and AI services may be governed by separate terms. DataStorified is not responsible for independent third-party products, availability, content, or transactions."),
      section("availability", "14. Availability", "We aim for a reliable service but do not guarantee uninterrupted, secure, or error-free availability. Maintenance, provider incidents, abuse controls, legal requirements, or product changes may limit or discontinue features without liability where permitted."),
      section("paid-services", "15. Future paid services", "Paid plans may introduce prices, billing cycles, taxes, quotas, renewal, refund, cancellation, and trial terms presented before purchase. We will not charge without affirmative authorization, and plan-specific terms will supplement these Terms."),
      section("termination", "16. Termination", "You may stop using the service at any time. We may suspend or terminate access for material breach, security risk, unlawful conduct, non-payment, or discontinuation, using notice where reasonable and legally required."),
      section("disclaimers", "17. Disclaimers", "To the fullest extent permitted by law, the service is provided \"as is\" and \"as available\" without warranties of accuracy, fitness, merchantability, non-infringement, availability, or results. Mandatory consumer warranties remain unaffected."),
      section("liability", "18. Limitation of liability", "To the fullest extent permitted by law, DataStorified will not be liable for indirect, incidental, special, consequential, exemplary, or lost-profit damages arising from use or inability to use the service. Any aggregate cap must be reviewed by counsel for the operating entity and jurisdiction."),
      section("indemnity", "19. Indemnity", "Where legally permitted, you agree to defend and indemnify DataStorified against third-party claims caused by your unlawful use, breach of these Terms, infringement, or content, except to the extent caused by DataStorified’s own misconduct."),
      section("governing-law", "20. Governing law", "These Terms are intended to be governed by the laws of India, without regard to conflict-of-law rules, with disputes subject to competent courts in Bengaluru, Karnataka, unless mandatory consumer law requires another forum. Legal counsel should confirm this provision before launch."),
      section("changes", "21. Changes to terms", "We may update these Terms for product, legal, security, or operational reasons. We will revise the date above and provide reasonable notice of material changes where required. Continued use after the effective date constitutes acceptance."),
      section("contact", "22. Contact", `Use the official contact page at ${CONTACT_URL} for questions or notices about these Terms. Select Legal and identify the sender, relevant service, issue, and requested resolution.`),
    ],
  }),
  policy({
    slug: "cookies", title: "Cookie Policy", icon: "cookies",
    description: "How cookies, local storage, and similar browser technologies support DataStorified.",
    related: ["privacy", "security", "acceptable-use"],
    sections: [
      section("what-are-cookies", "1. What cookies are", "Cookies are small text records a website asks a browser to retain. Similar technologies include local storage, session storage, pixels, and device identifiers, each with different lifetimes and controls."),
      section("how-used", "2. How DataStorified uses cookies", "We favor client-side operation and use storage only to deliver requested functionality, remember choices, protect the service, understand reliability, and support future optional sessions. We do not currently operate an advertising-cookie program."),
      section("essential", "3. Essential cookies", "Hosting, security, authentication, fraud prevention, load balancing, and consent controls may require essential cookies. These cannot always be disabled through our interface because the related feature may stop working."),
      section("preferences", "4. Preference storage", "Theme, display, favorites, recent items, and similar preferences may be stored locally so the browser can restore your workspace without an account."),
      section("analytics", "5. Analytics cookies", "If non-essential production analytics use cookies or identifiers, we will identify the provider, purpose, and duration and request consent where required before activation."),
      section("local-storage", "6. Local storage", "Phase 1 uses local storage for `ds.*` workspace keys. Local storage is not sent with every web request like a cookie, but scripts from the same site can read it; clearing site data removes it."),
      section("third-party", "7. Third-party cookies", "Embedded or linked providers may set their own cookies when you interact with their services. Their policies control those cookies, and we will minimize embedded third-party content where practical."),
      section("managing", "8. Managing cookies", "Browser settings let you view, block, or delete cookies and site data. Blocking essential storage may prevent login, saved preferences, consent memory, or security features from working correctly."),
      section("changes", "9. Changes", "We will update this policy before materially changing cookie categories or purposes and will refresh consent where required."),
      section("contact", "10. Contact", `Use the official contact page at ${CONTACT_URL} and select Privacy for cookie or browser-storage questions.`),
    ],
  }),
  policy({
    slug: "disclaimer", title: "Disclaimer", icon: "disclaimer",
    description: "Important limits on informational content, calculations, AI output, and external data.",
    related: ["terms", "ai-disclosure", "data-sources"],
    sections: [
      section("general", "1. General informational purpose", "DataStorified content and outputs are provided for general information, education, and preliminary scenario exploration. They are not a substitute for complete research or advice tailored to you."),
      section("financial", "2. No financial advice", "Budget, loan, affordability, retirement, and planning results do not constitute financial planning or a recommendation to borrow, spend, save, insure, or purchase a product."),
      section("investment", "3. No investment advice", "Return assumptions, SIP projections, CAGR, and comparisons are hypothetical and do not predict performance. Investments can lose value; consult a licensed adviser and official product documents."),
      section("legal", "4. No legal advice", "Policies, explanations, and tools do not create a lawyer-client relationship and may not reflect the law applicable to your facts or location."),
      section("tax", "5. No tax advice", "Tax and HRA calculations are simplified estimates based on stated assumptions and may omit deductions, surcharge, special-rate income, filing rules, amendments, or individual eligibility."),
      section("medical", "6. No medical advice", "BMI and health-adjacent content are screening information only, not diagnosis or treatment. Seek a qualified healthcare professional for medical questions or urgent care."),
      section("ai", "7. AI limitations", "AI systems can hallucinate, omit context, reproduce bias, or present uncertainty confidently. Verify important claims with authoritative sources and human expertise."),
      section("calculators", "8. Calculator limitations", "Formulas may simplify compounding, timing, eligibility, rates, taxes, fees, and future conditions. Small input changes can materially affect results."),
      section("data", "9. Data accuracy limitations", "Public datasets, provider APIs, manually entered rates, and editorial content may be delayed, incomplete, revised, or unavailable. Displaying a source does not guarantee its accuracy."),
      section("responsibility", "10. User responsibility", "You are responsible for validating inputs, understanding assumptions, considering alternatives, and deciding whether to act. Do not rely on a single DataStorified output for a consequential decision."),
      section("links", "11. External links", "External links are provided for convenience and do not imply endorsement. We do not control third-party content, security, availability, or transactions."),
      section("contact", "12. Contact", `Use the official contact page at ${CONTACT_URL} and select Feedback to report a material calculation, content, or sourcing concern.`),
    ],
  }),
  policy({
    slug: "ai-disclosure", title: "AI Disclosure", icon: "ai",
    description: "How DataStorified uses AI, communicates uncertainty, and keeps people responsible for final decisions.",
    related: ["privacy", "disclaimer", "data-sources", "acceptable-use"],
    sections: [
      section("how-ai-used", "1. How AI is used", "DataStorified may use AI to structure questions, explain results, summarize trade-offs, suggest next steps, moderate abuse, or assist future creator and API features. Phase 1 decision output is mocked and does not call a paid AI model."),
      section("explanations", "2. AI explanations", "AI explanations translate inputs or sourced information into readable language. They may omit exceptions or misstate causation and should be treated as a starting point for verification."),
      section("recommendations", "3. AI recommendations", "Recommendations reflect available inputs, configured prompts, model behavior, and product rules—not complete knowledge of your goals. They are assistance, not authority."),
      section("decision-output", "4. Decision Engine outputs", "Decision scores and confidence indicators are decision aids, not probabilities of success or guarantees. The interface should identify mocked, rules-based, and AI-generated elements."),
      section("human-verification", "5. Human verification", "Users should verify consequential claims with current primary sources and qualified professionals. DataStorified may review feedback but does not pre-approve every generated response."),
      section("limitations", "6. Limitations", "Models can generate false facts, broken citations, unsafe suggestions, inconsistent answers, and knowledge that is stale relative to current events or law."),
      section("bias", "7. Bias and uncertainty", "Training data, prompts, evaluation choices, and missing user context can introduce bias. We aim to communicate uncertainty, test high-impact workflows, and provide feedback paths rather than claim neutrality."),
      section("responsibility", "8. User responsibility", "Do not use AI output to make an automated high-impact decision about another person or as the sole basis for financial, employment, housing, legal, medical, safety, or eligibility action."),
      section("providers", "9. Data sent to AI providers", "Before an external model receives content, the feature should disclose the transfer and relevant provider. Avoid submitting credentials, confidential records, personal identifiers, or regulated data unless the feature explicitly supports them."),
      section("safety", "10. AI safety", "We may apply input restrictions, output filters, rate limits, logging, model evaluation, and human escalation to reduce misuse. Controls are imperfect and do not transfer responsibility away from the user."),
      section("feedback", "11. Feedback and correction", `Use in-product feedback when available or the official contact page at ${CONTACT_URL}. Include the prompt context, problematic output, and expected correction without unnecessary personal information.`),
    ],
  }),
  policy({
    slug: "security", title: "Security Policy", icon: "security",
    description: "Our security approach, local-storage model, file handling, and responsible disclosure process.",
    related: ["privacy", "acceptable-use", "ai-disclosure"],
    sections: [
      section("overview", "1. Security overview", "DataStorified uses a client-first design and managed hosting to reduce the server-side data footprint. Security is an ongoing risk-management process, not a guarantee that incidents cannot occur."),
      section("protection", "2. Data protection", "We minimize collection, restrict access, use reputable providers, review dependencies, separate environments where appropriate, and retain server data only for defined operational or legal purposes."),
      section("local-security", "3. Local storage security", "Browser local storage is not encrypted by DataStorified and is accessible within the same browser profile. Protect your device, avoid shared sessions, and clear site data before transferring or disposing of a device."),
      section("accounts", "4. Account security", "If accounts launch, users will be responsible for strong credentials and device access. We intend to support secure session management, rate limiting, recovery controls, and stronger authentication where risk warrants it."),
      section("encryption", "5. Encryption", "Production traffic uses HTTPS through managed infrastructure. Future sensitive server-side records should use provider-supported encryption at rest and narrowly scoped secret management."),
      section("files", "6. File handling", "Current file tools do not process uploads. Future tools will prefer in-browser processing and will clearly state when remote processing, temporary storage, limits, and deletion schedules apply."),
      section("disclosure", "7. Responsible disclosure", "Researchers should test only systems they own or have permission to assess, avoid privacy violations and disruption, use minimal proof, keep findings confidential while remediation is underway, and report promptly."),
      section("reporting", "8. Vulnerability reporting", `Use the Security option on the official contact page at ${CONTACT_URL}. Include the affected URL, reproduction steps, impact, and supporting evidence. Do not include live credentials or exploit unrelated accounts.`),
      section("limitations", "9. Security limitations", "We cannot guarantee rewards, response timelines, or safe harbor for destructive, extortionate, illegal, privacy-invasive, social-engineering, denial-of-service, or third-party testing. Good-faith reports will be assessed reasonably."),
      section("contact", "10. Contact security team", `Submit security reports through ${CONTACT_URL} using the Security topic. Use the Privacy topic for privacy matters so vulnerability reports remain clearly identified.`),
    ],
  }),
  policy({
    slug: "community", title: "Community Guidelines", icon: "community",
    description: "Standards for respectful participation in future community, creator, profile, and feedback spaces.",
    related: ["acceptable-use", "terms", "copyright"],
    sections: [
      section("respect", "1. Respectful use", "Engage constructively and respect different backgrounds, expertise, and decisions. Critique ideas without degrading, threatening, or targeting people."),
      section("abuse", "2. No abuse", "Do not exploit community features to coordinate harm, evade safeguards, expose private information, or repeatedly disrupt other users."),
      section("spam", "3. No spam", "Do not post repetitive, deceptive, irrelevant, or unsolicited promotional content or manipulate engagement through automation or coordinated inauthentic activity."),
      section("illegal", "4. No illegal content", "Do not publish, request, facilitate, or link to content that is illegal in the applicable jurisdiction or that promotes credible harm."),
      section("harassment", "5. No harassment", "Harassment, hate, stalking, sexual exploitation, credible threats, and targeted humiliation are prohibited. Context, severity, repetition, and power imbalance may affect enforcement."),
      section("misleading", "6. No misleading activity", "Do not fabricate credentials, results, endorsements, identities, sources, or financial outcomes. Clearly label simulations, satire, sponsorships, and AI-generated material where confusion is likely."),
      section("manipulation", "7. No platform manipulation", "Do not buy or fabricate engagement, coordinate false reports, evade enforcement, abuse discovery systems, or interfere with platform metrics."),
      section("reporting", "8. Reporting issues", `Report community concerns through available controls or ${CONTACT_URL} using the Support topic. Include relevant links and context without republishing harmful content unnecessarily.`),
      section("enforcement", "9. Enforcement", "We may reduce distribution, remove content, limit features, warn, suspend, or terminate access based on context and risk. Appeals may be offered where practical, but immediate action may be necessary for safety or law."),
    ],
  }),
  policy({
    slug: "acceptable-use", title: "Acceptable Use Policy", icon: "acceptable",
    description: "Prohibited conduct that protects users, infrastructure, providers, and the integrity of DataStorified.",
    related: ["terms", "community", "security"],
    sections: [
      section("illegal", "1. Illegal activity", "Do not use DataStorified to plan, enable, conceal, or promote conduct that violates applicable law, court orders, sanctions, or the rights of others."),
      section("fraud", "2. Fraud and deception", "Do not conduct phishing, scams, identity theft, deceptive financial activity, forged documentation, impersonation, or misrepresentation of outputs and affiliations."),
      section("malware", "3. Malware and system harm", "Do not create, distribute, test, or facilitate malware, credential theft, destructive code, unauthorized access, denial of service, or evasion against systems you do not own or have permission to assess."),
      section("spam", "4. Spam and automation abuse", "Do not use tools, APIs, profiles, or future creator features for unsolicited bulk messaging, artificial engagement, abusive automation, or traffic laundering."),
      section("scraping", "5. Scraping and resource abuse", "Do not scrape in a manner that ignores technical controls, overloads the service, reconstructs protected datasets, or violates law or contract. Respect documented API limits and robots directives."),
      section("harassment", "6. Harassment and exploitation", "Do not threaten, stalk, harass, exploit, discriminate against, sexualize without consent, or expose private information about another person."),
      section("impersonation", "7. Impersonation", "Do not falsely claim to be another person, organization, professional, public authority, or DataStorified representative, or obscure sponsorship and conflicts where disclosure is required."),
      section("infringement", "8. Infringing content", "Do not upload, publish, transform, or distribute material that infringes copyright, trademark, privacy, publicity, confidentiality, or other proprietary rights."),
      section("bypass", "9. Bypassing controls", "Do not circumvent authentication, access restrictions, safety filters, quotas, paywalls, rate limits, monitoring, or enforcement, including by coordinating multiple accounts or clients."),
      section("ai-misuse", "10. Misuse of AI or tools", "Do not use AI, calculators, or utilities to automate high-impact decisions about people, generate deceptive professional advice, create harmful targeting, or present unverified output as authoritative. We may investigate and restrict activity that creates material risk."),
    ],
  }),
  policy({
    slug: "data-sources", title: "Data Sources & Methodology", icon: "sources",
    description: "Where DataStorified information comes from, how methods are communicated, and what accuracy limits apply.",
    related: ["disclaimer", "ai-disclosure", "privacy"],
    sections: [
      section("types", "1. Types of data used", "DataStorified may use user inputs, embedded assumptions, formula definitions, editorial research, public datasets, official publications, and licensed third-party APIs. Each feature should identify material assumptions where practical."),
      section("user-data", "2. User-provided data", "Calculator, tool, and decision results depend on the completeness and accuracy of user-provided values. Local inputs are generally not independently verified by DataStorified."),
      section("public-data", "3. Public datasets", "Public datasets may come from government, academic, standards, regulatory, or reputable institutional publishers. Publication by an authority does not eliminate errors, revisions, geographic limits, or interpretation risk."),
      section("apis", "4. Third-party APIs", "Future rates, prices, locations, or reference data may come from external APIs with their own latency, coverage, uptime, licensing, and correction policies. The interface should display source and freshness when material."),
      section("ai", "5. AI-generated explanations", "AI may explain or synthesize source material but is not itself a primary source. Generated citations and claims must be verified before consequential use."),
      section("frequency", "6. Update frequency", "Update frequency varies by feature and source. Some data is static or manually maintained; other data may be fetched on demand. A displayed date is not a promise that no newer information exists."),
      section("accuracy", "7. Accuracy limitations", "Data can be delayed, incomplete, rounded, revised, mismatched to a jurisdiction, or incorrectly mapped. Service outages may cause fallbacks or stale values, which should be clearly labelled where possible."),
      section("methodology", "8. Methodology transparency", "Calculator formulas live in a centralized engine and pages explain key methods and assumptions. Decision and AI features should distinguish deterministic formulas, editorial rules, model output, and source data."),
      section("errors", "9. Reporting errors", `Use the Feedback topic at ${CONTACT_URL} to report suspected source or methodology errors. Include the page, observed value, expected value, source link, date, and reasoning. We may preserve an audit note for material corrections.`),
    ],
  }),
  policy({
    slug: "copyright", title: "Copyright Policy", icon: "copyright",
    description: "Ownership, user content, copyright complaints, takedowns, counter-notices, and repeat infringement.",
    related: ["terms", "community", "acceptable-use"],
    sections: [
      section("ownership", "1. Ownership", "DataStorified owns or licenses its software, visual design, original text, brand assets, and compiled materials. Third-party names, datasets, and content remain the property of their respective owners."),
      section("user-content", "2. User content", "Users retain rights in content they lawfully submit and are responsible for permissions. The service receives only the limited license described in the Terms to provide and operate requested features."),
      section("complaints", "3. Copyright complaints", "A rights holder or authorized agent may report material believed to infringe copyright. We may remove or restrict access while assessing a complete, good-faith notice."),
      section("takedown", "4. Copyright takedown request", `Use the Legal topic at ${CONTACT_URL} to provide a signed notice identifying the protected work and allegedly infringing material. This process is modeled on notice-and-takedown principles and should be reviewed for the operator’s applicable law.`),
      section("required-info", "5. Required complaint information", "Include your contact details, authority to act, identification of the copyrighted work, precise location of the material, a good-faith belief statement, an accuracy and authority statement, and a physical or electronic signature."),
      section("counter-notice", "6. Counter-notice", "A user may respond with identification of removed material, a good-faith statement that removal resulted from mistake or misidentification, contact and jurisdiction statements required by applicable law, and a signature. We may forward it to the complainant."),
      section("repeat", "7. Repeat infringers", "Where appropriate and technically possible, we may terminate or restrict users who repeatedly infringe rights, considering valid notices, counter-notices, context, and applicable law."),
      section("contact", "8. Contact", `Submit copyright, intellectual-property, or brand concerns through ${CONTACT_URL} using the Legal topic. Knowingly false notices may create liability.`),
    ],
  }),
  policy({
    slug: "accessibility", title: "Accessibility Statement", icon: "accessibility",
    description: "Our commitment, standards target, current accessibility features, limitations, and feedback process.",
    related: ["privacy", "community", "acceptable-use"],
    sections: [
      section("commitment", "1. Accessibility commitment", "DataStorified aims to make decision tools understandable and usable across devices, abilities, input methods, and assistive technologies. Accessibility is part of product quality and ongoing maintenance."),
      section("standards", "2. Standards target", "Our target is substantial conformance with WCAG 2.1 Level AA for public product surfaces. A standards target is not a claim that every page or third-party integration is currently conformant."),
      section("features", "3. Accessibility features", "The design uses semantic headings, labelled form controls, keyboard-accessible interactions, visible focus styles, readable sizing, responsive layouts, color contrast targets, reduced clutter, and text alternatives for meaningful interface icons where applicable."),
      section("limitations", "4. Known limitations", "Complex charts, generated content, third-party widgets, browser-native controls, and future file previews may present limitations. Automated checks cannot replace keyboard, screen-reader, zoom, contrast, and cognitive usability testing."),
      section("feedback", "5. Feedback process", `Use the Accessibility topic at ${CONTACT_URL}. Include the page URL, device, browser, assistive technology, expected behavior, and problem encountered. We prioritize barriers based on severity, reach, and available remediation.`),
      section("contact", "6. Contact", `Submit accessibility requests through ${CONTACT_URL} and describe a preferred accessible response method.`),
    ],
  }),
];

export const legalPolicyBySlug = (slug: string) => legalPolicies.find((item) => item.slug === slug);
export const policyHref = (slug: string) => `/legal/${slug}`;

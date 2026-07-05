export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const PRIVACY_UPDATED = "June 18, 2026";
export const TERMS_UPDATED = "June 18, 2026";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: "1. Introduction",
    paragraphs: [
      'MakersFlow ("we", "our", "us") provides a learning platform focused on robotics, AI, electronics, IoT and programming for young makers in India. This Privacy Policy explains what information we collect, why we collect it, and the choices you have.',
      "Because many of our learners are minors aged 10 to 17, we apply additional safeguards described in the Children's Privacy section below.",
    ],
  },
  {
    id: "data-collected",
    title: "2. Data we collect",
    paragraphs: ["We collect only the information needed to provide and improve our service:"],
    bullets: [
      "Account: full name, email address, phone number, grade and school.",
      "Google profile (if you sign in with Google): name, email, profile picture and Google account ID.",
      "Learning activity: enrolled courses, lesson progress, time spent, streaks, quiz attempts and certificates.",
      "Orders: items purchased, shipping address, and payment confirmations.",
      "Payment data: handled directly by Razorpay — we do not store full card details on our servers.",
      "Device and log data: browser type, IP address and basic usage events used for security and analytics.",
    ],
  },
  {
    id: "how-used",
    title: "3. How we use your data",
    bullets: [
      "Operate the platform — sign-in, course access, progress tracking and personalised recommendations.",
      "Process orders and deliver kits, books and merchandise.",
      "Send transactional emails such as receipts, password resets and course updates.",
      "Improve the platform through aggregated analytics and bug reports.",
      "Keep accounts secure and prevent fraud or abuse.",
    ],
  },
  {
    id: "sharing",
    title: "4. Data sharing & third parties",
    paragraphs: [
      "We never sell your personal data. We share data only with trusted processors that help us run the service:",
    ],
    bullets: [
      "Supabase — authentication, database and file storage hosting.",
      "Razorpay — payment processing for orders and course purchases.",
      "Google — when you choose to sign in with your Google account.",
      "Email delivery providers — to send you transactional and account emails.",
    ],
  },
  {
    id: "children",
    title: "5. Children's privacy",
    paragraphs: [
      "A large part of our community is aged 10 to 17. We take this responsibility seriously:",
    ],
    bullets: [
      "If you are under 18, please use MakersFlow with the involvement and consent of a parent or guardian.",
      "We collect only the minimum information needed to deliver lessons and ship orders — no behavioural tracking for advertising.",
      "We do not show third-party advertisements and we do not run any targeted advertising to minors.",
      "Parents and guardians can request access, correction or deletion of a minor's account at any time by contacting us.",
      "We do not knowingly enable public profiles, chat with strangers, or any feature that exposes minors to unknown third parties.",
    ],
  },
  {
    id: "rights",
    title: "6. Your rights",
    bullets: [
      "Access — request a copy of the personal data we hold about you.",
      "Correction — update inaccurate or incomplete information from your Profile page or by contacting us.",
      "Deletion — request that we delete your account and associated data.",
      "Portability — request a machine-readable export of your data.",
      "Withdraw consent — for Google sign-in or optional features at any time.",
    ],
  },
  {
    id: "security",
    title: "7. Security & retention",
    paragraphs: [
      "We protect your data using industry-standard practices including encryption in transit, role-based access controls and row-level security on our database. We retain account and learning data for as long as your account is active, and for a limited period afterwards to satisfy legal, accounting and dispute-resolution obligations.",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies & local storage",
    paragraphs: [
      "We use first-party cookies and browser local storage to keep you signed in, remember your preferences and measure aggregate usage. You can clear them at any time through your browser settings.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact us",
    paragraphs: [
      "For privacy questions, data requests or concerns about a minor's account, please email privacy@makersflow.com. We aim to respond within 7 business days.",
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    paragraphs: [
      "By creating an account or using MakersFlow, you agree to these Terms of Service. If you are under 18, you confirm that a parent or guardian has reviewed and accepted these terms on your behalf.",
    ],
  },
  {
    id: "use",
    title: "2. Acceptable use",
    bullets: [
      "Use the platform only for lawful learning, building and shopping.",
      "Do not share your account or attempt to access another user's account.",
      "Do not redistribute, resell or screen-record paid course content.",
      "Do not upload harmful, abusive, or infringing material.",
      "Be respectful in all discussion and community features.",
    ],
  },
  {
    id: "courses",
    title: "3. Course access",
    paragraphs: [
      "When you enroll in a paid course, you receive a personal, non-transferable license to access that course for the duration stated on the course page. Free courses are provided as-is. We may update lesson content from time to time to improve quality.",
    ],
  },
  {
    id: "purchases",
    title: "4. Orders & shipping",
    paragraphs: [
      "Orders for kits, books and merchandise are processed and shipped to the address you provide. Stock and pricing may change without notice. Risk of loss passes to you upon delivery to the carrier.",
    ],
  },
  {
    id: "refunds",
    title: "5. Refund policy",
    bullets: [
      "Courses: refundable within 7 days of purchase if you have completed less than 25% of the lessons.",
      "Physical products: returnable within 30 days of delivery in unused, original condition. Return shipping is borne by the customer unless the item arrived damaged or defective.",
      "Refunds are processed back to the original payment method via Razorpay within 7–10 business days.",
    ],
  },
  {
    id: "termination",
    title: "6. Account termination",
    paragraphs: [
      "You may delete your account from the Profile page at any time. We may suspend or terminate accounts that violate these terms, infringe rights of others, or compromise the safety of our community — especially minors.",
    ],
  },
  {
    id: "ip",
    title: "7. Intellectual property",
    paragraphs: [
      "All course content, videos, illustrations, written material and software on MakersFlow are owned by MakersFlow or its licensors. You retain ownership of any projects you build using our kits and courses.",
    ],
  },
  {
    id: "liability",
    title: "8. Disclaimers & liability",
    paragraphs: [
      'MakersFlow is provided on an "as-is" basis. While we work hard to make the platform reliable and accurate, we do not guarantee uninterrupted service or that the content will meet every learner\'s specific outcome.',
      "To the maximum extent permitted by law, MakersFlow's total liability for any claim related to the service is limited to the amount you paid us in the 12 months before the claim.",
    ],
  },
  {
    id: "changes",
    title: "9. Changes to these terms",
    paragraphs: [
      'We may update these terms occasionally. When we do, we will revise the "Last updated" date at the top of this page and, for significant changes, notify you by email or an in-app message.',
    ],
  },
  {
    id: "contact",
    title: "10. Contact",
    paragraphs: ["Questions about these terms? Email us at support@makersflow.com."],
  },
];

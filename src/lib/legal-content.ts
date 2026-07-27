export type SubSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: SubSection[];
};

export const PRIVACY_UPDATED = "January 2025";
export const TERMS_UPDATED = "January 2025";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: "Privacy Policy Overview",
    paragraphs: [
      'MakersFlow ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile learning management system application.',
    ],
  },
  {
    id: "section-1",
    title: "1. Information We Collect",
    subsections: [
      {
        title: "Account Information",
        paragraphs: ["When you register for a MakersFlow account, we collect:"],
        bullets: [
          "Full name",
          "Email address",
          "Phone number (if you sign up using phone OTP)",
          "Grade/Class level",
          "School or institution name",
        ],
      },
      {
        title: "Google Sign-In Information",
        paragraphs: [
          "If you choose to sign in with Google, we collect your Google account name, email address, and profile picture as provided by Google OAuth.",
        ],
      },
      {
        title: "Learning Data",
        paragraphs: ["To provide and improve our educational services, we collect:"],
        bullets: [
          "Course enrollment and progress tracking",
          "Lesson completion status",
          "Quiz scores and assessment results",
          "Learning streaks and activity patterns",
          "Time spent on courses and modules",
        ],
      },
      {
        title: "Payment Information",
        paragraphs: [
          "When you make purchases for courses or store items, payment processing is handled securely by Razorpay. MakersFlow does not store your credit card, debit card, or UPI credentials. We only receive transaction confirmation and order details from Razorpay.",
        ],
      },
      {
        title: "Device and Technical Information",
        paragraphs: [
          "We automatically collect certain information for app performance and crash reporting, including device type, operating system version, app version, and general usage statistics.",
        ],
      },
    ],
  },
  {
    id: "section-2",
    title: "2. How We Use Your Information",
    paragraphs: ["We use the collected information to:"],
    bullets: [
      "Create and manage your account",
      "Provide personalized learning experiences and course recommendations",
      "Track your learning progress and award certificates or badges",
      "Process payments for course enrollments and store purchases",
      "Send important notifications about course updates, streak reminders, and learning milestones",
      "Improve our app functionality and user experience",
      "Provide customer support and respond to your inquiries",
      "Ensure security and prevent fraud",
    ],
  },
  {
    id: "section-3",
    title: "3. Data Storage and Security",
    paragraphs: [
      "Your account data is stored securely using Supabase, a PostgreSQL-based database platform with Row Level Security (RLS) policies to ensure that users can only access their own data.",
      "Authentication tokens are stored in your device's secure storage (iOS Keychain or Android Keystore). Local progress data is cached on your device using AsyncStorage for offline access and faster app performance.",
      "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
    ],
  },
  {
    id: "section-4",
    title: "4. Children's Privacy",
    paragraphs: [
      "Many of our users are students under the age of 18. We are committed to protecting the privacy of minors and comply with applicable data protection laws, including India's Digital Personal Data Protection Act (DPDP Act).",
      "We do not knowingly collect more information than necessary for educational purposes from users under 18. Parents or legal guardians may contact us at team.makersflow@gmail.com to review, correct, or request deletion of their child's personal information.",
    ],
  },
  {
    id: "section-5",
    title: "5. Third-Party Services",
    paragraphs: ["MakersFlow uses the following third-party services to provide our application:"],
    bullets: [
      "Supabase: Authentication and database storage. See Supabase's privacy policy at supabase.com/privacy",
      "Google: OAuth sign-in services (if you choose Google login). See Google's privacy policy at policies.google.com/privacy",
      "Razorpay: Payment processing for course purchases and store transactions. See Razorpay's privacy policy at razorpay.com/privacy",
    ],
  },
  {
    id: "section-6",
    title: "6. Refund & Replacement Policy",
    paragraphs: [
      "All sales are final. We do not offer refunds or replacements after a purchase has been completed.",
      "If you receive a damaged, defective, or incorrect product, please contact our Support Team within 48 hours of delivery with your order details, clear photos, and an unboxing video (mandatory). After verification, we will review your request and provide an appropriate resolution if eligible.",
    ],
  },
  {
    id: "section-7",
    title: "7. Data Retention and Deletion",
    paragraphs: [
      "We retain your personal information for as long as your account is active or as needed to provide you services. If you wish to delete your account and all associated data, you may request deletion by contacting our support team via Settings → Help & Support or by emailing team.makersflow@gmail.com.",
      "Upon receiving a deletion request, we will delete your personal information within 30 days, except where we are required to retain certain information for legal or regulatory purposes.",
    ],
  },
  {
    id: "section-8",
    title: "8. Your Rights",
    paragraphs: [
      "You have the right to:",
    ],
    bullets: [
      "Access your personal information",
      "Correct inaccurate or incomplete data",
      "Request deletion of your account and personal data",
      "Withdraw consent for optional data collection",
      "Export your learning data",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "To exercise any of these rights, please contact us at team.makersflow@gmail.com.",
        ],
      },
    ],
  },
  {
    id: "section-9",
    title: "9. Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. When we make significant changes, we will notify you through the app or via email. Your continued use of MakersFlow after such changes constitutes your acceptance of the updated policy.",
    ],
  },
  {
    id: "section-10",
    title: "10. Contact Us",
    paragraphs: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:",
      "Email: team.makersflow@gmail.com",
      "Phone: +91 83095 89858",
      "Support: Settings → Help & Support",
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: "Terms Overview",
    paragraphs: [
      'These Terms of Service ("Terms") govern your access to and use of the MakersFlow mobile application ("App", "Service"). By creating an account or using MakersFlow, you agree to be bound by these Terms.',
    ],
  },
  {
    id: "section-1",
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By registering for an account, accessing, or using the MakersFlow application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these Terms, you may not use our Service.",
      "If you are under 18 years of age, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.",
    ],
  },
  {
    id: "section-2",
    title: "2. Description of Service",
    paragraphs: ["MakersFlow is a mobile learning management system (LMS) that provides:"],
    bullets: [
      "Video-based STEM courses and educational content",
      "Interactive lessons, quizzes, and assessments",
      "Physical learning kits and educational materials (via integrated store)",
      "Digital resources, PDFs, and study materials",
      "Progress tracking, certificates, and achievement badges",
      "Learning streaks and personalized recommendations",
    ],
  },
  {
    id: "section-3",
    title: "3. User Accounts",
    paragraphs: [
      "To access most features of MakersFlow, you must create an account. You agree to:",
    ],
    bullets: [
      "Provide accurate, current, and complete information during registration",
      "Maintain and promptly update your account information",
      "Maintain the security of your password and account credentials",
      "Accept all responsibility for activities that occur under your account",
      "Notify us immediately of any unauthorized access or security breach",
    ],
    subsections: [
      {
        title: "",
        paragraphs: [
          "You may not share your account credentials with others or allow others to access your account. Each account is for individual use only.",
        ],
      },
    ],
  },
  {
    id: "section-4",
    title: "4. Course Enrollment and Payments",
    paragraphs: [
      "MakersFlow offers both free and paid courses. All prices are listed in Indian Rupees (INR) unless otherwise stated.",
    ],
    subsections: [
      {
        title: "Payment Processing",
        paragraphs: [
          "Payments for courses, store items, and physical kits are processed securely through Razorpay, our third-party payment provider. By making a purchase, you agree to Razorpay's terms and conditions.",
        ],
      },
      {
        title: "Refund Policy",
        paragraphs: [
          "Refund requests for digital courses may be considered within 7 days of purchase if you have not completed more than 10% of the course content. Physical kits may be returned within 7 days of delivery if unused and in original packaging.",
          "To request a refund, contact our support team via Settings → Help & Support. Refunds are processed at our discretion and in accordance with applicable consumer protection laws.",
        ],
      },
    ],
  },
  {
    id: "section-5",
    title: "5. Content Ownership and Usage Rights",
    paragraphs: [
      "All course videos, materials, resources, quizzes, and other content provided through MakersFlow are the intellectual property of MakersFlow and our content partners. You are granted a limited, non-exclusive, non-transferable license to access and view the content solely for your personal, non-commercial educational use.",
      "You may not:",
    ],
    bullets: [
      "Download, record, redistribute, or share course content with others",
      "Use content for commercial purposes or resale",
      "Remove watermarks, attribution, or copyright notices",
      "Modify, reverse-engineer, or create derivative works from our content",
    ],
  },
  {
    id: "section-6",
    title: "6. Prohibited Conduct",
    paragraphs: ["You agree not to engage in any of the following prohibited activities:"],
    bullets: [
      "Sharing your account credentials or allowing unauthorized account access",
      "Attempting to bypass payment systems or access paid content without authorization",
      "Harassing, abusing, or threatening other users or MakersFlow staff",
      "Uploading malicious code, viruses, or harmful software",
      "Attempting to gain unauthorized access to our systems or databases",
      "Impersonating others or providing false information",
      "Using automated scripts or bots to access the Service",
    ],
  },
  {
    id: "section-7",
    title: "7. Certificates and Credentials",
    paragraphs: [
      "Upon successful completion of a course, you may receive a certificate of completion. These certificates are intended for personal and educational use to demonstrate your learning achievements.",
      "Unless explicitly stated otherwise, MakersFlow certificates are not accredited academic credentials and do not replace formal education or professional certifications. They should not be misrepresented as such.",
    ],
  },
  {
    id: "section-8",
    title: "8. Account Termination",
    paragraphs: [
      "We reserve the right to suspend or terminate your account at any time if you violate these Terms or engage in conduct that we determine, in our sole discretion, to be harmful to other users, our Service, or third parties.",
      "You may delete your account at any time by contacting support via Settings → Help & Support. Upon account deletion, you will lose access to all enrolled courses, progress data, and purchased content.",
    ],
  },
  {
    id: "section-9",
    title: "9. Limitation of Liability",
    paragraphs: [
      'MakersFlow and its content partners provide the Service on an "as is" and "as available" basis. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure.',
      "To the maximum extent permitted by law, MakersFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of learning progress, or loss of business opportunities arising from your use of the Service.",
    ],
  },
  {
    id: "section-10",
    title: "10. Changes to Terms",
    paragraphs: [
      "We may update these Terms of Service from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons. When we make significant changes, we will notify you through the app or via email.",
      "Your continued use of MakersFlow after such changes constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Service.",
    ],
  },
  {
    id: "section-11",
    title: "11. Governing Law",
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of MakersFlow shall be subject to the exclusive jurisdiction of the courts located in India.",
    ],
  },
  {
    id: "section-12",
    title: "12. Contact Us",
    paragraphs: [
      "If you have any questions about these Terms of Service, please contact us at:",
      "Email: team.makersflow@gmail.com",
      "Phone: +91 83095 89858",
      "Support: Settings → Help & Support",
    ],
  },
];

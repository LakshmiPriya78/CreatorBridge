import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Shield, Check, AlertCircle } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (view: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const { user, setTermsAccepted } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-sm text-slate-500">Please log in to review terms.</p>
      </div>
    );
  }

  const isCreator = user.role === 'creator';

  const handleConfirm = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.acceptTerms(true, 'v1.0');
      setTermsAccepted();
      if (isCreator) {
        onNavigate('creator-portfolio');
      } else {
        onNavigate('agency-profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record acceptance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            {isCreator ? 'Creator Terms and Conditions' : 'Agency & Brand Guidelines'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Version 1.0 · Binding Platform Agreement for {isCreator ? 'AI Content Creators' : 'Agencies & Brands'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Terms Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-h-[580px] overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100">
          {isCreator ? (
            /* EXACT 20 CREATOR TERMS RULES */
            <>
              {/* Part A */}
              <div className="pt-2">
                <h3 className="font-bold text-slate-950 text-sm mb-3">A. Account and Profile Security</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900">1. Provide Accurate Information:</span> Creators must provide truthful profile information, skills, experience, and pricing. Fake identities, impersonation, and fraudulent credentials are prohibited.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">2. Protect Account Credentials:</span> Creators must keep their passwords and authentication codes confidential. Account sharing, unauthorized access, and attempts to compromise other accounts are prohibited.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">3. Maintain an Accurate Portfolio:</span> Creators must upload work they have the right to showcase and accurately describe their contribution. Stolen work and falsely claimed authorship are prohibited.
                  </div>
                </div>
              </div>

              {/* Part B */}
              <div className="pt-4">
                <h3 className="font-bold text-slate-950 text-sm mb-3">B. AI Content and Intellectual Property</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900">4. Disclose AI Usage:</span> Creators must accurately disclose AI-generated or AI-assisted content when required by the platform, campaign brief, or applicable law.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">5. Respect Copyright and Intellectual Property:</span> Creators must not use copyrighted images, videos, music, logos, designs, or other protected materials without appropriate authorization or another valid legal basis.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">6. Prohibit Deceptive AI Content:</span> Creators must not submit deepfakes, fabricated testimonials, manipulated evidence, or misleading advertisements intended to deceive audiences.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">7. Follow Brand Guidelines:</span> Creators must follow the agency's approved brand identity, product information, target audience, content format, and campaign requirements.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">8. Protect Confidential Information:</span> Creators must not disclose unpublished advertisements, confidential briefs, client information, or private project files without authorization.
                  </div>
                </div>
              </div>

              {/* Part C */}
              <div className="pt-4">
                <h3 className="font-bold text-slate-950 text-sm mb-3">C. Project Management and Professional Conduct</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900">9. Accept Projects Responsibly:</span> Creators should accept projects only when they understand the requirements, agree to the proposed price, and can reasonably meet the deadline.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">10. Meet Agreed Deadlines:</span> Creators must submit deliverables by the agreed deadline or promptly notify the agency of a potential delay and request an extension.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">11. Maintain Honest Project Status:</span> Creators must update project progress accurately. Falsely marking work as completed, submitted, or approved is prohibited.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">12. Follow the Revision Process:</span> Creators must address reasonable revisions covered by the original agreement. Additional work outside the agreed scope must be negotiated and approved by both parties.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">13. Communicate Professionally:</span> Creators must communicate respectfully with agencies and platform staff. Harassment, threats, discrimination, blackmail, and abusive conduct are prohibited.
                  </div>
                </div>
              </div>

              {/* Part D */}
              <div className="pt-4">
                <h3 className="font-bold text-slate-950 text-sm mb-3">D. Payments and Transactions</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900">14. Use the Platform's Payment System:</span> Creators must follow the platform's payment procedures for projects governed by its on-platform payment rules. Payment terms must be agreed upon and recorded before work begins.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">15. Prohibit Payment Fraud:</span> Fake invoices, fabricated payment confirmations, refund manipulation, and deliberate financial deception are prohibited.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">16. Follow Agreed Licensing and Usage Rights:</span> Creators must respect the agreed terms governing advertisement ownership, licensing, permitted usage, duration, and distribution. Payment alone does not automatically determine ownership.
                  </div>
                </div>
              </div>

              {/* Part E */}
              <div className="pt-4">
                <h3 className="font-bold text-slate-950 text-sm mb-3">E. Ratings, Trust, and Platform Compliance</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900">17. Maintain Genuine Ratings and Reviews:</span> Creators must not buy fake reviews, manipulate ratings, threaten reviewers, or create fake accounts to improve their reputation.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">18. Cooperate with Verification and Investigations:</span> Creators must provide reasonable supporting evidence when required for legitimate verification, intellectual-property complaints, or suspected policy violations. They must not submit forged evidence.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">19. Follow Platform Policies and Enforcement Decisions:</span> Creators must comply with applicable laws, platform policies, and legitimate enforcement decisions. Depending on the violation, the platform may issue warnings, remove content, restrict features, suspend accounts, or terminate accounts.
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">20. Accept Accountability for Serious Violations:</span> Fraud, deliberate infringement, scams, unauthorized disclosure of confidential information, and other potentially unlawful conduct may result in account termination, legally justified recovery of losses, or referral to appropriate authorities. Creators must have access to a fair complaint and appeal process, subject to applicable law.
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* EXACT 20 AGENCY/BRAND GUIDELINES RULES */
            <div className="space-y-3 pt-2">
              <div>
                <span className="font-semibold text-slate-900">1. Authentic Registration:</span> Provide accurate agency details and valid contact information during registration.
              </div>
              <div>
                <span className="font-semibold text-slate-900">2. Profile Verification:</span> Complete the platform's required verification process before accessing restricted agency features.
              </div>
              <div>
                <span className="font-semibold text-slate-900">3. Clear Project Brief:</span> Provide complete project requirements, deliverables, and expectations before inviting a creator.
              </div>
              <div>
                <span className="font-semibold text-slate-900">4. Transparent Budget:</span> Clearly communicate the proposed budget and payment terms before confirming a project.
              </div>
              <div>
                <span className="font-semibold text-slate-900">5. Realistic Deadlines:</span> Set achievable deadlines and agree on timelines with the selected creator.
              </div>
              <div>
                <span className="font-semibold text-slate-900">6. Direct Invitations:</span> Send project invitations only to relevant creators and include all essential project details.
              </div>
              <div>
                <span className="font-semibold text-slate-900">7. Mutual Agreement:</span> Obtain the creator's acceptance of the project's scope, budget, and deadline before starting work.
              </div>
              <div>
                <span className="font-semibold text-slate-900">8. Respectful Communication:</span> Maintain professional, polite, and respectful communication with all creators.
              </div>
              <div>
                <span className="font-semibold text-slate-900">9. No Unpaid Work:</span> Do not demand unpaid deliverables or additional work beyond the agreed scope without mutual consent.
              </div>
              <div>
                <span className="font-semibold text-slate-900">10. Fair Revisions:</span> Clearly specify the number of included revisions and request additional revisions only under mutually agreed terms.
              </div>
              <div>
                <span className="font-semibold text-slate-900">11. Timely Responses:</span> Respond to creator queries, submissions, and revision requests within a reasonable timeframe.
              </div>
              <div>
                <span className="font-semibold text-slate-900">12. Scope Protection:</span> Do not change project requirements, deliverables, or deadlines without discussing and agreeing on the changes with the creator.
              </div>
              <div>
                <span className="font-semibold text-slate-900">13. Payment Commitment:</span> Fulfil agreed payment obligations according to the confirmed payment terms.
              </div>
              <div>
                <span className="font-semibold text-slate-900">14. Intellectual Property Respect:</span> Respect copyright, licensing conditions, and ownership agreements relating to creator-generated content.
              </div>
              <div>
                <span className="font-semibold text-slate-900">15. Usage Rights Clarity:</span> Define the permitted commercial usage, distribution, modification, and portfolio-display rights before work begins.
              </div>
              <div>
                <span className="font-semibold text-slate-900">16. AI Content Compliance:</span> Ensure project requirements comply with applicable laws, AI-tool terms, and relevant content policies.
              </div>
              <div>
                <span className="font-semibold text-slate-900">17. Confidentiality:</span> Protect creators' personal information, confidential materials, and non-public project details.
              </div>
              <div>
                <span className="font-semibold text-slate-900">18. Honest Feedback:</span> Provide clear, constructive feedback based on the agreed project requirements.
              </div>
              <div>
                <span className="font-semibold text-slate-900">19. No Misrepresentation:</span> Do not misuse creator portfolios, falsely claim ownership, or misrepresent completed work.
              </div>
              <div>
                <span className="font-semibold text-slate-900">20. Dispute Resolution:</span> Cooperate with CreatorBridge's dispute-resolution process and comply with applicable platform rules.
              </div>
            </div>
          )}
        </div>

        {/* Acceptance Checkbox & Button */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-700 leading-snug">
              I have read, understood, and formally agree to comply with the entire {isCreator ? 'Creator Terms and Conditions' : 'Agency & Brand Guidelines'} (Version 1.0).
            </span>
          </label>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-[11px] text-slate-500">
              Account: <span className="font-semibold text-slate-700">{user.email}</span> · Role: <span className="font-semibold uppercase">{user.role}</span>
            </div>

            <button
              type="button"
              disabled={!agreed || submitting}
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                agreed && !submitting
                  ? isCreator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving Acceptance...'
                  : isCreator
                  ? 'Confirm & Continue'
                  : 'Proceed Further'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

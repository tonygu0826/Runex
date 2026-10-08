import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "Terms & Privacy Policy | Runex Logistics",
  description: "Website terms and conditions, privacy policy and SMS / text messaging terms for Runex Logistics.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="interior-page legal-page">
      <SiteHeader />
      <header className="page-hero legal-hero" id="terms-and-conditions">
        <p className="eyebrow"><span /> Terms &amp; Privacy Policy</p>
        <h1>Runex Terms and Conditions</h1>
      </header>
      <article className="legal-content" aria-label="Runex website terms and privacy policy">
        <nav className="legal-jump-links" aria-label="Policy sections">
          <a href="#privacy-policy">Privacy Policy</a>
          <a href="#sms-text-messaging-terms">SMS / Text Messaging Terms</a>
        </nav>
        <p>{"The following terms and conditions govern your use of the Runex website at "}<a href="https://runexlogi.com/">https://runexlogi.com/</a>{". Your viewing and/or use of this site constitutes your agreement, on behalf of yourself and the entity you are representing, to all of the terms and conditions provided below."}</p>
        <p>{"Runex reserves the right to alter or make changes to these terms and conditions at any time without notice. Your viewing and/or use of the Runex website constitutes your agreement to the changes."}</p>
        <section className="legal-section" aria-labelledby="definitions">
          <h2 id="definitions">{"1. Definitions"}</h2>
          <p>{"Content: Information, products, functionality, graphics, services, documents, and links available through the Runex website."}</p>
          <p>{"Runex: Runex and its affiliated companies, where applicable."}</p>
          <p>{"You: Yourself and the entity you represent."}</p>
        </section>
        <section className="legal-section" aria-labelledby="use-of-runex-com">
          <h2 id="use-of-runex-com">{"2. Use of runexlogi.com"}</h2>
          <p>{"The Runex website is provided for current and potential Runex customers and users to obtain information about Runex and its services and to communicate with Runex."}</p>
          <p>{"All information, services, shipment-related information, tracking information, documents, and other materials provided through the website are intended for legitimate business and customer-related purposes."}</p>
          <p>{"You agree not to use the Runex website for any unlawful purpose or in any manner that violates these Terms and Conditions."}</p>
        </section>
        <section className="legal-section" aria-labelledby="ownership">
          <h2 id="ownership">{"3. Ownership"}</h2>
          <p>{"The website and its contents are the intellectual property of Runex, its affiliates, or licensors."}</p>
          <p>{"The content is protected by Canadian and international copyright, trademark, and other applicable laws."}</p>
          <p>{"You may not copy, reproduce, translate, distribute, export, import, upload, download, reverse engineer, modify, or otherwise use any part of the website or its content except as expressly permitted under these Terms and Conditions or applicable law."}</p>
        </section>
        <section className="legal-section" aria-labelledby="submissions">
          <h2 id="submissions">{"4. Submissions"}</h2>
          <p>{"Runex may receive inquiries, comments, information, or other submissions through the website. Runex does not accept ideas or concepts for new services or products through the website. If such information or comments are received, Runex has no obligation to keep them confidential. By submitting such information or comments, you grant Runex unrestricted rights to communicate, distribute, and exploit them in any manner it chooses."}</p>
        </section>
        <section className="legal-section" aria-labelledby="limitation-of-liability">
          <h2 id="limitation-of-liability">{"5. Limitation of Liability"}</h2>
          <p>{"Use of the Runex website and its contents is at your sole risk."}</p>
          <p>{"To the maximum extent permitted by applicable law, Runex will not be liable to you or any person or entity claiming through you for incidental, indirect, exemplary, consequential, or other damages arising from your use of, or inability to use, the website or its content, including loss of data or business interruption."}</p>
        </section>
        <section className="legal-section" aria-labelledby="disclaimer-of-warranties">
          <h2 id="disclaimer-of-warranties">{"6. Disclaimer of Warranties"}</h2>
          <p>{"While Runex makes reasonable efforts to ensure that the information contained on this website is complete and accurate, the website and its content are provided \"AS IS\" and \"AS AVAILABLE\"."}</p>
          <p>{"Runex makes no representations or warranties regarding the website, its content, or the results that may be obtained through its use."}</p>
          <p>{"To the maximum extent permitted by applicable law, Runex disclaims all warranties, whether express, implied, or statutory, including warranties of merchantability and fitness for a particular purpose."}</p>
          <p>{"No verbal or written information, representation, or advice provided by Runex or an authorized representative of Runex shall create a warranty unless expressly stated otherwise."}</p>
        </section>
        <section className="legal-section" aria-labelledby="indemnity">
          <h2 id="indemnity">{"7. Indemnity"}</h2>
          <p>{"You agree to indemnify and hold harmless Runex, its affiliates, officers, directors, employees, agents, and representatives from any claims, liabilities, damages, losses, or expenses arising from your breach of these Terms and Conditions or your unlawful use of the website."}</p>
        </section>
        <section className="legal-section" aria-labelledby="jurisdiction-and-forum">
          <h2 id="jurisdiction-and-forum">{"8. Jurisdiction and Forum"}</h2>
          <p>{"These Terms and Conditions and your use of the Runex website are governed by and construed in accordance with the laws of Canada, without regard to its conflict of law provisions."}</p>
          <p>{"If any provision of these Terms and Conditions is found to be unenforceable, that provision shall be enforced to the maximum extent permitted by law, and the remaining provisions shall remain in full force and effect."}</p>
        </section>
        <section className="legal-section" aria-labelledby="links-to-other-websites">
          <h2 id="links-to-other-websites">{"9. Links to Other Websites"}</h2>
          <p>{"The Runex website may contain links to other third-party websites."}</p>
          <p>{"Runex has no control over the content of linked websites and makes no representations or warranties regarding such websites or their content."}</p>
          <p>{"Users should be aware that third-party websites may have terms of use and privacy policies that differ significantly from those of Runex."}</p>
          <p>{"Use of third-party websites is entirely at your own risk."}</p>
        </section>
        <section className="legal-section" aria-labelledby="privacy-policy">
          <h2 id="privacy-policy">{"10. Privacy Policy"}</h2>
          <p>{"The Runex Privacy Policy governs the collection, use, and protection of information acquired from you through the Runex website."}</p>
          <p>{"No mobile information will be shared or sold with third parties or affiliates for marketing or promotional purposes."}</p>
          <p>{"All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties."}</p>
        </section>
        <section className="legal-section" aria-labelledby="sms-text-messaging-terms">
          <h2 id="sms-text-messaging-terms">{"11. SMS / Text Messaging Terms"}</h2>
          <p>{"If you opt in to receive SMS or text messages from Runex, the following terms apply:"}</p>
          <p>{"Message and data rates may apply."}</p>
          <p>{"Message frequency may vary."}</p>
          <p>{"You may opt out of receiving SMS messages at any time by replying STOP to any SMS message from Runex."}</p>
          <p>{"For assistance, reply HELP to any SMS message or contact us at "}<a href="mailto:support@runexlogi.com">support@runexlogi.com</a>{"."}</p>
          <p>{"Your consent to receive SMS messages is not a condition of purchasing any goods or services."}</p>
          <p>{"Runex will not sell or share your mobile phone number, SMS opt-in information, or SMS consent information with third parties or affiliates for their own marketing or promotional purposes."}</p>
        </section>
        <section className="legal-section" aria-labelledby="complete-agreement">
          <h2 id="complete-agreement">{"12. Complete Agreement"}</h2>
          <p>{"These Terms and Conditions constitute the entire agreement between you and Runex with respect to your use of the Runex website."}</p>
        </section>
        <section className="legal-section" aria-labelledby="termination">
          <h2 id="termination">{"13. Termination"}</h2>
          <p>{"Runex may, at its sole discretion and to the extent permitted by applicable law, suspend or terminate your access to the website or its content at any time without notice."}</p>
        </section>
        <section className="legal-section" aria-labelledby="changes-to-these-terms">
          <h2 id="changes-to-these-terms">{"14. Changes to These Terms"}</h2>
          <p>{"Runex reserves the right to update or modify these Terms and Conditions at any time."}</p>
          <p>{"Any changes will become effective when posted on the website. Your continued use of the Runex website after such changes are posted constitutes your acceptance of the revised Terms and Conditions."}</p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}

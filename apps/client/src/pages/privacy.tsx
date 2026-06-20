import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export function PrivacyPolicy() {
	return (
		<div className="min-h-screen bg-sidebar overflow-x-hidden">
			<Navbar />
			<main className="pt-28 pb-20">
				<div className="mx-auto max-w-3xl px-6">
					<h1 className="text-3xl font-semibold text-foreground mb-2">
						Privacy Policy
					</h1>
					<p className="text-sm text-muted-foreground mb-8">
						Last updated: June 20, 2026
					</p>

					<div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								1. Introduction
							</h2>
							<p>
								Welcome to Flowmation ("we," "our," or "us"). We are committed
								to protecting your personal information and your right to
								privacy. This Privacy Policy explains how we collect, use,
								disclose, and safeguard your information when you use our
								workflow automation platform and related services (collectively,
								the "Service").
							</p>
							<p className="mt-3">
								By using the Service, you agree to the collection and use of
								information in accordance with this policy. If you do not agree
								with the terms of this policy, please do not access the Service.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								2. Information We Collect
							</h2>

							<h3 className="text-base font-medium text-foreground mt-4 mb-2">
								2.1 Account Information
							</h3>
							<p>
								When you create an account, we collect information you provide
								directly:
							</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>Email address</li>
								<li>Name</li>
								<li>
									Authentication credentials (passkey credentials, or Google
									OAuth profile information)
								</li>
							</ul>

							<h3 className="text-base font-medium text-foreground mt-4 mb-2">
								2.2 Workflow Data
							</h3>
							<p>
								We store the workflows you create, including node
								configurations, connections, execution history, and output data.
								This data is stored securely in our database and is associated
								with your account.
							</p>

							<h3 className="text-base font-medium text-foreground mt-4 mb-2">
								2.3 Third-Party Service Credentials
							</h3>
							<p>
								When you connect third-party services (such as Google, GitHub,
								Notion, Slack, or others) to use in your workflows, we store
								authentication tokens and API keys on your behalf. These
								credentials are encrypted at rest and used solely to execute
								your workflows as configured.
							</p>

							<h3 className="text-base font-medium text-foreground mt-4 mb-2">
								2.4 File Uploads
							</h3>
							<p>
								If you upload files through the Service, those files are
								temporarily processed and stored via our third-party hosting
								provider. Files are retained in accordance with our data
								retention practices described in Section 6.
							</p>

							<h3 className="text-base font-medium text-foreground mt-4 mb-2">
								2.5 Automatically Collected Information
							</h3>
							<p>
								When you access the Service, we may automatically collect
								technical information such as IP address, browser type and
								version, operating system, pages visited, and referring website.
								This data is used to operate and improve the Service.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								3. How We Use Your Information
							</h2>
							<p>We use the information we collect to:</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>Provide, operate, and maintain the Service</li>
								<li>Process and execute your workflows</li>
								<li>Authenticate your identity and secure your account</li>
								<li>
									Communicate with you about your account, updates, and support
								</li>
								<li>
									Monitor and analyze usage patterns to improve the Service
								</li>
								<li>
									Detect, prevent, and address technical issues and security
									threats
								</li>
								<li>Comply with legal obligations</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								4. How We Share Your Information
							</h2>
							<p>
								We do not sell your personal information. We may share your
								information only in the following circumstances:
							</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>
									<strong>With service providers:</strong> We use third-party
									services to operate the Service (e.g., database hosting, file
									storage, cloud infrastructure). These providers process data
									on our behalf and are bound by contractual obligations to
									protect your information.
								</li>
								<li>
									<strong>With your connected integrations:</strong> When you
									configure a workflow to interact with a third-party service
									(e.g., sending an email, posting to Slack), data is
									transmitted to that service as directed by your workflow
									configuration.
								</li>
								<li>
									<strong>For legal compliance:</strong> We may disclose your
									information if required to do so by law or in response to
									valid requests by public authorities.
								</li>
								<li>
									<strong>Business transfers:</strong> In the event of a merger,
									acquisition, or sale of assets, your information may be
									transferred as part of that transaction, subject to the same
									privacy protections.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								5. Data Security
							</h2>
							<p>
								We implement industry-standard security measures to protect your
								personal information, including encryption of sensitive data at
								rest, encrypted communications (HTTPS/TLS), secure cookie
								handling, and role-based access controls. While we strive to use
								commercially acceptable means to protect your information, no
								method of transmission over the Internet or electronic storage
								is 100% secure.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								6. Data Retention
							</h2>
							<p>
								We retain your personal information only for as long as
								necessary to fulfill the purposes for which it was collected:
							</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>
									<strong>Account data:</strong> Retained for the lifetime of
									your account.
								</li>
								<li>
									<strong>Workflow data and execution logs:</strong> Retained
									indefinitely unless you delete them.
								</li>
								<li>
									<strong>Third-party credentials:</strong> Retained until you
									revoke access or delete your account.
								</li>
								<li>
									<strong>Session cookies:</strong> Expire after 14 days of
									inactivity.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								7. Your Rights
							</h2>
							<p>
								Depending on your jurisdiction, you may have the following
								rights regarding your personal information:
							</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>
									<strong>Access:</strong> Request a copy of the personal data
									we hold about you.
								</li>
								<li>
									<strong>Correction:</strong> Request correction of inaccurate
									or incomplete data.
								</li>
								<li>
									<strong>Deletion:</strong> Request deletion of your personal
									data and account.
								</li>
								<li>
									<strong>Portability:</strong> Request a copy of your data in a
									machine-readable format.
								</li>
								<li>
									<strong>Objection:</strong> Object to processing of your
									personal data.
								</li>
							</ul>
							<p className="mt-3">
								To exercise any of these rights, please contact us through our
								website. We will respond to your request within 30 days.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								8. Cookies
							</h2>
							<p>
								We use cookies and similar technologies for authentication and
								session management. We do not use third-party analytics or
								advertising trackers.
							</p>
							<p className="mt-3">
								<strong>Types of cookies we use:</strong>
							</p>
							<ul className="list-disc list-inside mt-2 space-y-1 ml-4">
								<li>
									<strong>Authentication cookies:</strong> Required for logging
									in and maintaining your session. These are essential for the
									Service to function.
								</li>
								<li>
									<strong>Security cookies:</strong> Used during OAuth flows and
									passkey authentication challenges. These are temporary and
									expire within minutes.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								9. Changes to This Policy
							</h2>
							<p>
								We may update this Privacy Policy from time to time. We will
								notify you of any material changes by posting the new policy on
								this page and updating the "Last updated" date at the top. Your
								continued use of the Service after any changes constitutes
								acceptance of the updated policy.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-medium text-foreground mb-3">
								10. Contact Us
							</h2>
							<p>
								If you have any questions about this Privacy Policy, please
								visit{" "}
								<a
									href="https://flowmation.tech"
									className="text-primary hover:underline"
								>
									flowmation.tech
								</a>
								.
							</p>
						</section>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

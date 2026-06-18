import type { FC, SVGProps } from "react";
import CalcomIcon from "@/assets/icons/nodes/calcom.svg?react";
import CalendlyIcon from "@/assets/icons/nodes/calendly.svg?react";
import ChatgptIcon from "@/assets/icons/nodes/chatgpt.svg?react";
import DiscordIcon from "@/assets/icons/nodes/discord.svg?react";
import DropboxIcon from "@/assets/icons/nodes/dropbox.svg?react";
import GithubIcon from "@/assets/icons/nodes/github.svg?react";
import GmailIcon from "@/assets/icons/nodes/gmail.svg?react";
import GoogleCalendarIcon from "@/assets/icons/nodes/google-calendar.svg?react";
import GoogleDriveIcon from "@/assets/icons/nodes/google-drive.svg?react";
import GoogleSheetsIcon from "@/assets/icons/nodes/google-sheets.svg?react";
import HubspotIcon from "@/assets/icons/nodes/hubspot.svg?react";
import JiraIcon from "@/assets/icons/nodes/jira.svg?react";
import LinearIcon from "@/assets/icons/nodes/linear.svg?react";
import NotionIcon from "@/assets/icons/nodes/notion.svg?react";
import PostgresqlIcon from "@/assets/icons/nodes/postgresql.svg?react";
import RazorpayIcon from "@/assets/icons/nodes/razorpay.svg?react";
import SlackIcon from "@/assets/icons/nodes/slack.svg?react";
import TelegramIcon from "@/assets/icons/nodes/telegram.svg?react";

type Integration = {
	icon: FC<SVGProps<SVGSVGElement>>;
	name: string;
	color: string;
};

const row1Items: Integration[] = [
	{ icon: GmailIcon, name: "Gmail", color: "#EA4335" },
	{ icon: SlackIcon, name: "Slack", color: "#E01E5A" },
	{ icon: GithubIcon, name: "GitHub", color: "#fff" },
	{ icon: NotionIcon, name: "Notion", color: "#fff" },
	{ icon: DiscordIcon, name: "Discord", color: "#5865F2" },
	{ icon: ChatgptIcon, name: "ChatGPT", color: "#10A37F" },
	{ icon: LinearIcon, name: "Linear", color: "#5E6AD2" },
];

const row2Items: Integration[] = [
	{ icon: GoogleSheetsIcon, name: "Google Sheets", color: "#34A853" },
	{ icon: GoogleDriveIcon, name: "Google Drive", color: "#4285F4" },
	{ icon: GoogleCalendarIcon, name: "Google Calendar", color: "#4285F4" },
	{ icon: TelegramIcon, name: "Telegram", color: "#26A5E4" },
	{ icon: JiraIcon, name: "Jira", color: "#0052CC" },
	{ icon: HubspotIcon, name: "HubSpot", color: "#FF7A59" },
	{ icon: CalendlyIcon, name: "Calendly", color: "#006BFF" },
];

const row3Items: Integration[] = [
	{ icon: RazorpayIcon, name: "Razorpay", color: "#3399FF" },
	{ icon: CalcomIcon, name: "Cal.com", color: "#3B82F6" },
	{ icon: DropboxIcon, name: "Dropbox", color: "#0061FF" },
	{ icon: PostgresqlIcon, name: "PostgreSQL", color: "#4169E1" },
	{ icon: GmailIcon, name: "Gmail", color: "#EA4335" },
	{ icon: SlackIcon, name: "Slack", color: "#E01E5A" },
	{ icon: GithubIcon, name: "GitHub", color: "#fff" },
];

function MarqueeRow({
	items,
	duration = 35,
	reverse = false,
}: {
	items: Integration[];
	duration?: number;
	reverse?: boolean;
}) {
	const set = (
		<>
			{items.map((integration, i) => {
				const Icon = integration.icon;
				return (
					<div
						key={`${integration.name}-${i}`}
						className="flex items-center gap-4 shrink-0 pr-14"
					>
						<Icon className="size-10" style={{ color: integration.color }} />
						<span className="text-[17px] font-semibold text-foreground whitespace-nowrap">
							{integration.name}
						</span>
					</div>
				);
			})}
		</>
	);

	return (
		<div className="overflow-hidden">
			<div
				className="flex w-fit"
				style={{
					animation: `marquee ${duration}s linear infinite ${reverse ? "reverse" : "normal"}`,
				}}
			>
				{set}
				{set}
				{set}
			</div>
		</div>
	);
}

export function Integrations() {
	return (
		<section className="py-28">
			<div className="px-6 mb-14 text-center">
				<h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold text-foreground">
					Connects with your favorite tools
				</h2>
			</div>

			<div className="flex flex-col gap-10">
				<MarqueeRow items={row1Items} duration={45} />
				<MarqueeRow items={row2Items} duration={40} reverse />
				<MarqueeRow items={row3Items} duration={50} />
			</div>
		</section>
	);
}

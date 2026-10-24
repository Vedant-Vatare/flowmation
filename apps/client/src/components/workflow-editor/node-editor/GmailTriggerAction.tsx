export const GmailTriggerAction = () => {
	return (
		<div className="px-3 py-3 border-b border-border/50 text-xs text-muted-foreground space-y-2">
			<p>
				Connect Google, choose a label, and publish. New matching emails will
				start this workflow.
			</p>
			<p>
				Only one published Gmail trigger per mailbox is supported. Existing
				emails are not imported.
			</p>
			<p>
				If the workflow stops receiving emails after a long downtime, unpublish
				and publish again to start from new emails.
			</p>
		</div>
	);
};

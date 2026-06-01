export const isUserAuthenticated = (): boolean => {
	const value = document.cookie
		.split("; ")
		.find((c) => c.startsWith("is_authenticated="))
		?.split("=")[1];
	return value === "true";
};

export const clearAuthCookie = async () => {
	await cookieStore.delete("is_authenticated");
};

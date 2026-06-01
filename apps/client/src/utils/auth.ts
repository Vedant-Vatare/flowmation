export const isUserAuthenticated = async () => {
	return await cookieStore.get("is_authenticated=true");
};

export const clearAuthCookie = (): void => {
	cookieStore.delete("is_authenticated");
};

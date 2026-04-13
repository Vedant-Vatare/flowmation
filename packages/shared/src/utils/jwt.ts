import jwt from "jsonwebtoken";

interface jwt_Payload extends jwt.JwtPayload {
	userId: string;
}
export const createJWT = async (data: jwt_Payload) => {
	return jwt.sign(data, process.env.JWT_secret as string, {
		algorithm: "HS256",
		expiresIn: "14d",
	});
};

export const verifyJWT = async (token: string) => {
	try {
		return jwt.verify(token, process.env.JWT_secret as string) as jwt_Payload;
	} catch (e: unknown) {
		if (e instanceof jwt.TokenExpiredError) {
			throw new Error("Token expired");
		}
		if (e instanceof jwt.JsonWebTokenError) {
			throw new Error("Invalid JWT Token");
		}
		throw new Error("failed to verify token");
	}
};

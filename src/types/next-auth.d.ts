import { DefaultUser } from "next-auth";
import { ICompanyLoginResponse } from "@models/response/login/iCompanyLoginResponse";

declare module "next-auth" {
    // JWT is the object stored in the backend
    interface JWT {
        accessToken: string;
        refreshToken: string;
        sub: string;
        name: string;
        email: string;
        picture: string;
        expiration: number;
        error?: string;
    }

    // Session is the object returned to the client
    interface Session {
        error?: string;
        user: {
            id: string;
            companies: ICompanyLoginResponse[];
        } & DefaultUser;
    }

    // User is the object returned by authorize
    interface User extends DefaultUser {
        accessToken: string;
        refreshToken: string;
        sub: string;
        name: string;
        email: string;
        picture: string;
        expiration: number;
    }
}
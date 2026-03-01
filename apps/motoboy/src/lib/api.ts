import ky from "ky";
import { supabase } from "./supabase";

const backboneUrl = import.meta.env.VITE_BACKBONE_URL as string;

if (!backboneUrl) {
  throw new Error("VITE_BACKBONE_URL deve estar definido em .env");
}

export const api = ky.create({
  prefixUrl: backboneUrl,
  hooks: {
    beforeRequest: [
      async (request) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          request.headers.set(
            "Authorization",
            `Bearer ${session.access_token}`,
          );
        }
      },
    ],
  },
});

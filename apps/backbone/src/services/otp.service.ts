import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { db } from "../db.js";
import { otpCodes, companyConfigs, profiles } from "../../db/schema/index.js";
import { redis } from "./redis.js";
import { sendWhatsAppMessage } from "./whatsapp.service.js";
import { sendEmail, buildOtpEmailHtml } from "./smtp.service.js";
import { supabaseAdmin } from "../lib/supabase.js";

const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

export async function generateAndSend(
  phoneOrEmail: string,
  channel: "whatsapp" | "email",
  companyId?: string
): Promise<void> {
  // Rate limit via Redis
  const rateKey = `otp:rate:${phoneOrEmail}`;
  const current = await redis.incr(rateKey);
  if (current === 1) {
    await redis.expire(rateKey, OTP_RATE_WINDOW_SECONDS);
  }
  if (current > OTP_RATE_LIMIT) {
    throw new OtpError(429, "Limite de envios excedido — tente novamente em 1 minuto");
  }

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await bcrypt.hash(code, 10);

  // Save to otp_codes
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  await db.insert(otpCodes).values({
    phone_or_email: phoneOrEmail,
    code_hash: codeHash,
    channel,
    company_id: companyId ?? null,
    expires_at: expiresAt,
  });

  // Dispatch based on channel
  if (channel === "whatsapp") {
    await sendViaWhatsApp(phoneOrEmail, code, companyId);
  } else {
    await sendViaSmtp(phoneOrEmail, code, companyId);
  }
}

export async function verify(
  phoneOrEmail: string,
  code: string
): Promise<{
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; role: string; companyId: string };
}> {
  // Find latest unverified, unexpired OTP code for this phone/email
  const now = new Date().toISOString();
  const [otpRecord] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone_or_email, phoneOrEmail),
        eq(otpCodes.verified, false),
        gt(otpCodes.expires_at, now)
      )
    )
    .orderBy(desc(otpCodes.created_at))
    .limit(1);

  if (!otpRecord) {
    throw new OtpError(400, "Codigo invalido ou expirado");
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpError(400, "Muitas tentativas — solicite novo codigo");
  }

  // Increment attempts
  await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(eq(otpCodes.id, otpRecord.id));

  // Verify code
  const isValid = await bcrypt.compare(code, otpRecord.code_hash);
  if (!isValid) {
    throw new OtpError(400, "Codigo invalido");
  }

  // Mark as verified
  await db
    .update(otpCodes)
    .set({ verified: true })
    .where(eq(otpCodes.id, otpRecord.id));

  // Lookup profile by phone or email
  const profile = await findProfileByPhoneOrEmail(phoneOrEmail);
  if (!profile) {
    throw new OtpError(400, "Nenhum usuario encontrado para este telefone/email");
  }

  // Generate auth tokens via Supabase Admin API
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

  if (linkError || !linkData) {
    throw new OtpError(500, "Erro ao gerar token de autenticacao");
  }

  // Extract the token from the link and verify it to get a session
  const actionLink = linkData.properties?.action_link;
  if (!actionLink) {
    throw new OtpError(500, "Erro ao gerar link de autenticacao");
  }

  // Parse token from the action link
  const linkUrl = new URL(actionLink);
  const token = linkUrl.searchParams.get("token") || linkUrl.hash?.split("token=")[1];

  if (!token) {
    throw new OtpError(500, "Erro ao extrair token de autenticacao");
  }

  // Verify the OTP token to get a session
  const { data: sessionData, error: sessionError } =
    await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });

  if (sessionError || !sessionData.session) {
    throw new OtpError(500, "Erro ao criar sessao de autenticacao");
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      companyId: profile.company_id,
    },
  };
}

// --- Internal helpers ---

async function sendViaWhatsApp(
  phone: string,
  code: string,
  companyId?: string
): Promise<void> {
  const config = companyId ? await getCompanyConfig(companyId) : null;

  if (!config?.otp_whatsapp_enabled || !config.otp_whatsapp_url || !config.otp_whatsapp_api_key) {
    throw new OtpError(400, "Canal WhatsApp nao configurado para esta empresa");
  }

  const message = `Seu codigo de verificacao e: ${code}\n\nEste codigo expira em ${OTP_EXPIRY_MINUTES} minutos.`;
  await sendWhatsAppMessage(config.otp_whatsapp_url, config.otp_whatsapp_api_key, phone, message);
}

async function sendViaSmtp(
  email: string,
  code: string,
  companyId?: string
): Promise<void> {
  const config = companyId ? await getCompanyConfig(companyId) : null;

  if (
    !config?.otp_smtp_enabled ||
    !config.otp_smtp_host ||
    !config.otp_smtp_port ||
    !config.otp_smtp_user ||
    !config.otp_smtp_pass_encrypted ||
    !config.otp_smtp_from
  ) {
    throw new OtpError(400, "Canal Email nao configurado para esta empresa");
  }

  const smtpConfig = {
    host: config.otp_smtp_host,
    port: config.otp_smtp_port,
    user: config.otp_smtp_user,
    pass: config.otp_smtp_pass_encrypted, // Will be decrypted by F-008; for now used as-is
    from: config.otp_smtp_from,
    tls: config.otp_smtp_tls,
  };

  const html = buildOtpEmailHtml(code, OTP_EXPIRY_MINUTES);
  await sendEmail(smtpConfig, email, "Codigo de verificacao", html);
}

async function getCompanyConfig(companyId: string) {
  const [config] = await db
    .select()
    .from(companyConfigs)
    .where(eq(companyConfigs.company_id, companyId));
  return config ?? null;
}

async function findProfileByPhoneOrEmail(
  phoneOrEmail: string
): Promise<{ id: string; email: string; role: string; company_id: string } | null> {
  // Try by phone first
  const [byPhone] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.phone, phoneOrEmail))
    .limit(1);

  if (byPhone) {
    // Get email from Supabase Auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(byPhone.id);
    return {
      id: byPhone.id,
      email: authUser?.user?.email ?? "",
      role: byPhone.role,
      company_id: byPhone.company_id,
    };
  }

  // Try by email (lookup in auth.users via Supabase Admin)
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = userList?.users?.find((u) => u.email === phoneOrEmail);

  if (authUser) {
    const [profileRecord] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, authUser.id))
      .limit(1);

    if (profileRecord) {
      return {
        id: profileRecord.id,
        email: authUser.email ?? "",
        role: profileRecord.role,
        company_id: profileRecord.company_id,
      };
    }
  }

  return null;
}

// Custom error class for OTP-specific errors
export class OtpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "OtpError";
  }
}

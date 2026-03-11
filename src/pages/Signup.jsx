import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { validateInvite } from "../services/invites"
import { useI18n } from "../i18n/i18n"

function normalizeUsername(value) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "")
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "")
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getLocalizedSignupError(errorCode, t, lang) {
  const map = {
    TOO_MANY_REQUESTS:
      lang === "ar"
        ? "طلبات كثيرة جدًا. حاول مرة أخرى بعد قليل."
        : "Too many requests. Please try again later.",
    UNAUTHORIZED:
      lang === "ar"
        ? "غير مصرح لك بهذا الإجراء."
        : "Unauthorized.",
    USERNAME_REQUIRED: t.signup_username_invalid,
    INVALID_USERNAME: t.signup_username_invalid,
    MISSING_REQUIRED_FIELDS: t.signup_missing_fields,
    INVALID_EMAIL: t.signup_invalid_email,
    PASSWORD_TOO_SHORT: t.signup_password_too_short,
    INVALID_SLUG: t.signup_slug_invalid,
    INVALID_INVITE: t.signup_invalid_invite,
    INVITE_EXPIRED: t.signup_invalid_invite,
    INVITE_ALREADY_USED: t.signup_invalid_invite,
    SLUG_ALREADY_TAKEN: t.signup_slug_taken,
    USERNAME_ALREADY_TAKEN: t.signup_username_taken,
    FAILED_TO_CREATE_USER:
      lang === "ar" ? "فشل إنشاء المستخدم." : "Failed to create user.",
    FAILED_TO_CREATE_PROFILE:
      lang === "ar" ? "فشل إنشاء الملف الشخصي." : "Failed to create profile.",
    FAILED_TO_CREATE_SETTINGS:
      lang === "ar" ? "فشل إنشاء الإعدادات." : "Failed to create settings.",
    FAILED_TO_CREATE_SUBSCRIPTION:
      lang === "ar" ? "فشل إنشاء الاشتراك." : "Failed to create subscription.",
    FAILED_TO_UPDATE_INVITE_USAGE:
      lang === "ar"
        ? "فشل تحديث استخدام الدعوة."
        : "Failed to update invite usage.",
    SERVER_ERROR: t.signup_unexpected_error,
  }

  return map[errorCode] || t.signup_unexpected_error
}

export default function Signup() {
  const { t, lang } = useI18n()
  const isRTL = lang === "ar"

  const [params] = useSearchParams()
  const inviteCode = params.get("invite")

  const [invite, setInvite] = useState(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [pageError, setPageError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")

  const [checkingUsername, setCheckingUsername] = useState(false)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [usernameTaken, setUsernameTaken] = useState(false)
  const [slugTaken, setSlugTaken] = useState(false)

  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username]
  )

  const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug])

  const isUsernameFormatValid =
    normalizedUsername.length > 0 && /^[a-z0-9_]+$/.test(normalizedUsername)

  const isSlugFormatValid =
    normalizedSlug.length > 0 && /^[a-z0-9-]+$/.test(normalizedSlug)

  useEffect(() => {
    async function check() {
      if (!inviteCode) {
        setPageError(t.signup_invite_only)
        setLoadingInvite(false)
        return
      }

      try {
        const data = await validateInvite(inviteCode)
        setInvite(data)
      } catch (e) {
        const code = e?.message || "INVALID_INVITE"
        setPageError(getLocalizedSignupError(code, t, lang))
      } finally {
        setLoadingInvite(false)
      }
    }

    check()
  }, [inviteCode, t, lang])

  useEffect(() => {
    let ignore = false

    async function checkUsernameAvailability() {
      if (!normalizedUsername || !isUsernameFormatValid) {
        setUsernameTaken(false)
        return
      }

      setCheckingUsername(true)

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle()

      if (!ignore) {
        setUsernameTaken(!!data && !error)
        setCheckingUsername(false)
      }
    }

    const timeout = setTimeout(checkUsernameAvailability, 400)

    return () => {
      ignore = true
      clearTimeout(timeout)
    }
  }, [normalizedUsername, isUsernameFormatValid])

  useEffect(() => {
    let ignore = false

    async function checkSlugAvailability() {
      if (!normalizedSlug || !isSlugFormatValid) {
        setSlugTaken(false)
        return
      }

      setCheckingSlug(true)

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", normalizedSlug)
        .maybeSingle()

      if (!ignore) {
        setSlugTaken(!!data && !error)
        setCheckingSlug(false)
      }
    }

    const timeout = setTimeout(checkSlugAvailability, 400)

    return () => {
      ignore = true
      clearTimeout(timeout)
    }
  }, [normalizedSlug, isSlugFormatValid])

  const allFieldsFilled =
    firstName.trim() &&
    lastName.trim() &&
    normalizedUsername &&
    normalizedSlug &&
    email.trim() &&
    password &&
    confirmPassword

  const passwordValid = password.length >= 8
  const passwordsMatch = password === confirmPassword
  const emailValid = isValidEmail(email)

  const canSubmit =
    !!allFieldsFilled &&
    emailValid &&
    passwordValid &&
    passwordsMatch &&
    isUsernameFormatValid &&
    isSlugFormatValid &&
    !usernameTaken &&
    !slugTaken &&
    !checkingUsername &&
    !checkingSlug &&
    !submitting &&
    !!invite

  async function handleSignup(e) {
    e.preventDefault()
    setFormError("")
    setSuccess("")

    if (!inviteCode) {
      setFormError(t.signup_invalid_invite)
      return
    }

    if (!allFieldsFilled) {
      setFormError(t.signup_missing_fields)
      return
    }

    if (!emailValid) {
      setFormError(t.signup_invalid_email)
      return
    }

    if (!isUsernameFormatValid) {
      setFormError(t.signup_username_invalid)
      return
    }

    if (!isSlugFormatValid) {
      setFormError(t.signup_slug_invalid)
      return
    }

    if (usernameTaken) {
      setFormError(t.signup_username_taken)
      return
    }

    if (slugTaken) {
      setFormError(t.signup_slug_taken)
      return
    }

    if (!passwordValid) {
      setFormError(t.signup_password_too_short)
      return
    }

    if (!passwordsMatch) {
      setFormError(t.signup_password_mismatch)
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-with-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: normalizedUsername,
            slug: normalizedSlug,
            email: email.trim(),
            password,
            inviteCode,
            lang,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFormError(getLocalizedSignupError(data?.error, t, lang))
        return
      }

      setSuccess(t.signup_success)
      setFirstName("")
      setLastName("")
      setUsername("")
      setSlug("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (e) {
      console.error("Signup error:", e)
      setFormError(t.signup_unexpected_error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInvite) {
    return <p className="mt-20 text-center">{t.signup_checking_invite}</p>
  }

  if (pageError) {
    return <p className="mt-20 text-center text-red-400">{pageError}</p>
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h1 className={`mb-6 text-2xl font-bold ${isRTL ? "text-right" : ""}`}>
          {t.signup_title}
        </h1>

        {invite && (
          <div className={`mb-4 text-xs opacity-70 ${isRTL ? "text-right" : ""}`}>
            {lang === "ar" ? "الدعوة صالحة" : "Invite is valid"}
            {invite.plan?.name
              ? ` — ${lang === "ar" ? "الخطة" : "Plan"}: ${invite.plan.name}`
              : ""}
          </div>
        )}

        {formError && (
          <div className={`mb-3 text-sm text-red-400 ${isRTL ? "text-right" : ""}`}>
            {formError}
          </div>
        )}

        {success && (
          <div className={`mb-3 text-sm text-green-400 ${isRTL ? "text-right" : ""}`}>
            {success}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder={t.signup_first_name}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input w-full"
          />

          <input
            type="text"
            placeholder={t.signup_last_name}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input w-full"
          />

          <div>
            <input
              type="text"
              placeholder={t.signup_username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              dir="ltr"
            />

            {username && !isUsernameFormatValid && (
              <p className="mt-1 text-xs text-red-400">
                {t.signup_username_invalid}
              </p>
            )}

            {isUsernameFormatValid && usernameTaken && (
              <p className="mt-1 text-xs text-red-400">
                {t.signup_username_taken}
              </p>
            )}

            {checkingUsername && (
              <p className="mt-1 text-xs opacity-70">
                {lang === "ar" ? "جارٍ التحقق..." : "Checking..."}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <span
                className="whitespace-nowrap px-3 text-sm text-white/50"
                dir="ltr"
              >
                {t.signup_slug_prefix}
              </span>

              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent p-2 outline-none"
                placeholder="your-name"
                dir="ltr"
              />
            </div>

            {slug && !isSlugFormatValid && (
              <p className="mt-1 text-xs text-red-400">
                {t.signup_slug_invalid}
              </p>
            )}

            {isSlugFormatValid && slugTaken && (
              <p className="mt-1 text-xs text-red-400">
                {t.signup_slug_taken}
              </p>
            )}

            {checkingSlug && (
              <p className="mt-1 text-xs opacity-70">
                {lang === "ar" ? "جارٍ التحقق..." : "Checking..."}
              </p>
            )}
          </div>

          <input
            type="email"
            placeholder={t.signup_email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            dir="ltr"
          />

          <input
            type="password"
            placeholder={t.signup_password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            dir="ltr"
          />

          {password && !passwordValid && (
            <p className="-mt-2 text-xs text-red-400">
              {t.signup_password_too_short}
            </p>
          )}

          <input
            type="password"
            placeholder={t.signup_confirm_password}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            dir="ltr"
          />

          {confirmPassword && !passwordsMatch && (
            <p className="-mt-2 text-xs text-red-400">
              {t.signup_password_mismatch}
            </p>
          )}

          <button
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
          >
            {submitting ? t.signup_loading : t.signup_button}
          </button>
        </form>
      </div>
    </div>
  )
}

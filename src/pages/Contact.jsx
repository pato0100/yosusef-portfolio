import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Turnstile } from "react-turnstile"
import { useI18n } from "../i18n/i18n"
import { useParams } from "react-router-dom"

const FUNCTION_URL =
  "https://vmehwkqdptatlmygavgb.supabase.co/functions/v1/send-contact"

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function Contact() {
  const { t, lang } = useI18n()
  const { slug } = useParams()

  const isRTL = lang === "ar"
  const turnstileRef = useRef(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    company: "", // honeypot
  })

  const [turnstileToken, setTurnstileToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const validate = () => {
    if (!form.name || !form.email || !form.message) {
      return t.contact_required
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return t.contact_invalid_email
    }

    if (!turnstileToken) {
      return lang === "ar"
        ? "من فضلك أكمل التحقق الأمني."
        : "Please complete the security check."
    }

    return null
  }

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
      company: "",
    })
    setTurnstileToken("")
    turnstileRef.current?.reset?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Honeypot
    if (form.company) return

    if (!slug) {
      setError(lang === "ar" ? "الملف الشخصي غير صالح." : "Invalid profile.")
      return
    }

    // Client cooldown
    const lastSent = localStorage.getItem("lastContactTime")
    if (lastSent && Date.now() - Number(lastSent) < 30000) {
      setError(
        lang === "ar"
          ? "من فضلك انتظر قليلًا قبل إرسال رسالة أخرى."
          : "Please wait before sending again."
      )
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message.")
      }

      localStorage.setItem("lastContactTime", Date.now().toString())
      setSuccess(true)
      resetForm()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setError(
        err.message ||
          (lang === "ar"
            ? "حدث خطأ، حاول مرة أخرى."
            : "Something went wrong. Please try again.")
      )
      setTurnstileToken("")
      turnstileRef.current?.reset?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container-max py-16">
      <div className="card p-8 max-w-2xl mx-auto">
        <h2 className={`text-2xl font-bold mb-6 ${isRTL ? "text-right" : ""}`}>
          {t.contact_title}
        </h2>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10"
            >
              <div
                className="text-5xl mb-4"
                style={{ color: "var(--brand)" }}
              >
                ✓
              </div>
              <p className="text-lg font-semibold">{t.contact_success}</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <input
                className="input"
                placeholder={`${t.contact_name} *`}
                name="name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                className="input"
                placeholder={`${t.contact_email} *`}
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <input
                className="input"
                placeholder={t.contact_subject}
                name="subject"
                value={form.subject}
                onChange={handleChange}
              />

              <textarea
                className="input min-h-[140px]"
                placeholder={`${t.contact_message} *`}
                name="message"
                value={form.message}
                onChange={handleChange}
              />

              <div className={isRTL ? "flex justify-end" : "flex justify-start"}>
                <Turnstile
                  ref={turnstileRef}
                  sitekey={TURNSTILE_SITE_KEY}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => {
                    setTurnstileToken("")
                    setError(
                      lang === "ar"
                        ? "فشل التحقق الأمني، حاول مرة أخرى."
                        : "Security verification failed. Please try again."
                    )
                  }}
                  options={{
                    theme: "dark",
                    size: "normal",
                    language: lang === "ar" ? "ar" : "en",
                  }}
                />
              </div>

              {error && (
                <p
                  className={`text-sm ${isRTL ? "text-right" : ""}`}
                  style={{ color: "var(--brand)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? t.contact_sending : t.contact_send}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
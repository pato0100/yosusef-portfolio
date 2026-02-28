import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useI18n } from "../i18n/i18n"

const OWNER_ID = "77992332-19a8-40a6-86bd-df445ab4ad26" // ← UID بتاعك

export default function Contact() {
  const { t, lang } = useI18n()
  const isRTL = lang === "ar"

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    company: "", // honeypot anti-spam
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    if (!form.name || !form.email || !form.message) {
      return t.contact_required
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return t.contact_invalid_email
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // 🛡 Honeypot
    if (form.company) return

    // 🛡 Rate limit (30 ثانية)
    const lastSent = localStorage.getItem("lastContactTime")
    if (lastSent && Date.now() - lastSent < 30000) {
      setError("Please wait before sending again.")
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(
        "https://vmehwkqdptatlmygavgb.functions.supabase.co/send-contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner_id: OWNER_ID,
            name: form.name,
            email: form.email,
            subject: form.subject,
            message: form.message,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed")
      }

      localStorage.setItem("lastContactTime", Date.now())

      setSuccess(true)
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        company: "",
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("Something went wrong. Please try again.")
    }

    setLoading(false)
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
              <p className="text-lg font-semibold">
                {t.contact_success}
              </p>
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
              {/* Honeypot hidden field */}
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                style={{ display: "none" }}
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
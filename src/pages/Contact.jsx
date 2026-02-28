import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useI18n } from "../i18n/i18n"

export default function Contact() {
  const { t, lang } = useI18n()
  const isRTL = lang === "ar"

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
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

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setForm({ name: "", email: "", subject: "", message: "" })
      setTimeout(() => setSuccess(false), 3000)
    }, 1200)
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
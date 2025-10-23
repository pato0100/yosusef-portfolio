import { motion } from "framer-motion";

export default function SocialIcon({ href, label, children, delay = 0 }) {
  if (!href) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="icon-btn"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      {children}
    </motion.a>
  );
}

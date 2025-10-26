import SocialIcon from "./SocialIcon";
import {
  FaLinkedin,
  FaGithub,
  FaXTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";

export default function SocialBar({ socials = {}, whatsapp }) {
  const items = [
    { key: "linkedin", label: "LinkedIn", icon: <FaLinkedin size={18} /> },
    { key: "github", label: "GitHub", icon: <FaGithub size={18} /> },
    { key: "x", label: "X", icon: <FaXTwitter size={18} /> },
    { key: "facebook", label: "Facebook", icon: <FaFacebook size={18} /> },
    { key: "instagram", label: "Instagram", icon: <FaInstagram size={18} /> },
    { key: "youtube", label: "YouTube", icon: <FaYoutube size={18} /> },
    { key: "tiktok", label: "TikTok", icon: <FaTiktok size={18} /> },
  ];

  // واتساب من رقم الهاتف (يفتح شات مباشرة)
const wa = whatsapp ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}` : null;


  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {items.map((it, i) => (
        <SocialIcon
          key={it.key}
          href={socials[it.key]}
          label={it.label}
          delay={i * 0.05}
        >
          {it.icon}
        </SocialIcon>
      ))}
      {wa && (
        <SocialIcon href={wa} label="WhatsApp" delay={items.length * 0.05}>
          <FaWhatsapp size={18} />
        </SocialIcon>
      )}
    </div>
  );
}

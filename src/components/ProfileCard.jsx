// ===============================
// src/components/ProfileCard.jsx — FINAL VERSION
// ===============================

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../i18n/i18n'
import SocialBar from './SocialBar'
import QRCode from 'qrcode'

// ===============================
// vCard utils
// ===============================

const chooseTypeFromLabel = (label = "") => {
  const l = (label || "").toLowerCase();
  if (/(work|عمل)/.test(l)) return "WORK";
  if (/(home|شخصي|بيت|منزل|personal)/.test(l)) return "HOME";
  return "CELL";
};

const onlyDigitsPlus = (s = "") => s.replace(/[^+\d]/g, "");

// توليد ملف vCard
export function generateVCard(p) {
  const lines = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  const safeName =
    (p.name && p.name.trim()) ||
    (p.displayName && p.displayName.trim()) ||
    (p.name_en && p.name_en.trim()) ||
    (p.name_ar && p.name_ar.trim()) ||
    "User";

  lines.push(`N:${safeName};;;;`);
  lines.push(`FN:${safeName}`);

  if (p.title) lines.push(`TITLE:${p.title}`);
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${p.email}`);

  const tel1Type = chooseTypeFromLabel(p.phoneLabel);
  if (p.phone) {
    const n = onlyDigitsPlus(p.phone);
    lines.push(`item1.TEL;type=${tel1Type};type=CELL;type=VOICE;type=pref:${n}`);
    lines.push(`item1.X-ABLabel:${p.phoneLabel || "Mobile"}`);
  }

  const tel2Type = chooseTypeFromLabel(p.phone2Label);
  if (p.phone2) {
    const n2 = onlyDigitsPlus(p.phone2);
    lines.push(`item2.TEL;type=${tel2Type};type=CELL;type=VOICE:${n2}`);
    lines.push(`item2.X-ABLabel:${p.phone2Label || "Work"}`);
  }

  if (p.whatsapp) {
    const wa = onlyDigitsPlus(p.whatsapp);
    if (wa) {
      lines.push(`item3.URL:https://wa.me/${wa}`);
      lines.push("item3.X-ABLabel:WhatsApp");
    }
  }

  const socialOrder = [
    ["linkedin", "LinkedIn"],
    ["github", "GitHub"],
    ["x", "X"],
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["youtube", "YouTube"],
    ["facebook", "Facebook"],
  ];
  let itemIdx = 4;
  if (p.socials) {
    for (const [key, label] of socialOrder) {
      const url = p.socials[key];
      if (!url) continue;
      lines.push(`item${itemIdx}.URL:${url}`);
      lines.push(`item${itemIdx}.X-ABLabel:${label}`);
      itemIdx++;
    }
  }

  if (p.about) {
    const note = p.about.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    lines.push(`NOTE:${note}`);
  }

  // ✅ دعم الصورة Base64 أو URL
  if (p.photoBase64) {
    if (p.photoBase64.startsWith('data:image')) {
      const [meta, b64] = p.photoBase64.split(',');
      const m = /data:image\/([a-z0-9+.-]+);base64/i.exec(meta || '');
      const type = (m?.[1] || 'JPEG').toUpperCase();
      if (b64) lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${b64}`);
    } else {
      lines.push(`PHOTO;VALUE=URI:${p.photoBase64}`);
    }
  }

  lines.push("END:VCARD");

  const content = lines.join("\r\n");
  return new Blob([content], { type: "text/vcard;charset=utf-8" });
}

export function downloadVCard(p, filename) {
  const file = filename || `${(p.name || "contact").replace(/\s+/g, "_")}.vcf`;
  const blob = generateVCard(p);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ===============================
// ProfileCard component
// ===============================

export default function ProfileCard({ profile }) {
  const { t, lang } = useI18n();

  const T = (p, key, lang) =>
    (lang === 'ar' ? p[`${key}_ar`] : p[`${key}_en`]) ?? p[key] ?? '';

  const displayName = T(profile, 'name', lang);
  const displayTitle = T(profile, 'title', lang);
  const displayAbout = T(profile, 'about', lang);
  const displayPhoneLabel = T(profile, 'phoneLabel', lang) || (lang === 'ar' ? 'الشخصي' : 'Personal');
  const displayPhone2Label = T(profile, 'phone2Label', lang) || (lang === 'ar' ? 'العمل' : 'Work');

  const { name, title, about, image, socials, cv, email, phone, phone2, whatsapp } = profile;

  const tel1 = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const tel2 = phone2 ? `tel:${phone2.replace(/[^\d+]/g, '')}` : '';

  async function handleDownloadContact() {
    let finalImage = image;

    // ✅ لو الصورة URL → نحولها Base64 قبل إنشاء vCard
    if (image && !image.startsWith('data:image')) {
      try {
        const res = await fetch(image);
        const blob = await res.blob();
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        finalImage = await base64Promise;
      } catch (err) {
        console.warn('Image conversion failed, fallback to URL');
      }
    }

    downloadVCard({
      name: displayName,
      title,
      email,
      phone,
      phone2,
      phoneLabel: displayPhoneLabel,
      phone2Label: displayPhone2Label,
      whatsapp,
      about,
      socials,
      photoBase64: finalImage,
    }, `${(displayName || 'contact').replace(/\s+/g, '_')}.vcf`);
  }

  // باقي الكود زي ما هو (CV, call, QR)
  // ...

  const [qrDataUrl, setQrDataUrl] = useState('');
  useEffect(() => {
    const profileUrl = window.location.href;
    QRCode.toDataURL(profileUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFFFF' }
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, []);

  function downloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${(name || 'profile')}_QR.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // JSX نفس النسخة الحالية عندك
  // (مش محتاج تعديل غير في handleDownloadContact)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6 md:p-10"
    >
      {/* ... JSX الحالي زي ما عندك */}
    </motion.section>
  );
}
س
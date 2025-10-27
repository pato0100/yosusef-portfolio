// ===============================
// src/components/ProfileCard.jsx — SINGLE FILE VERSION
// - Contains vCard utils (generateVCard, downloadVCard)
// - AND the ProfileCard component that uses them
// - No self-imports, no name conflicts
// ===============================

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../i18n/i18n'
import SocialBar from './SocialBar'
import QRCode from 'qrcode';


// ===============================
// vCard utils (kept in this file to avoid cross-file issues)
// ===============================

const chooseTypeFromLabel = (label = "") => {
  const l = (label || "").toLowerCase();
  if (/(work|عمل)/.test(l)) return "WORK";
  if (/(home|شخصي|بيت|منزل|personal)/.test(l)) return "HOME";
  return "CELL"; // safe default
};

const onlyDigitsPlus = (s = "") => s.replace(/[^+\d]/g, "");

const extractBase64 = (dataUrl = "") => {
  if (!dataUrl) return "";
  const comma = dataUrl.indexOf(",");
  return comma > -1 ? dataUrl.slice(comma + 1) : dataUrl;
};



export function generateVCard(p) {
  const lines = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  // الاسم الآمن
  const safeName = (p.name || p.displayName || "Youssef Mahmoud").trim();
  const [firstName, ...rest] = safeName.split(" ");
  const lastName = rest.join(" ");
  lines.push(`N:${lastName};${firstName};;;`);
  lines.push(`FN:${safeName}`);

  // الوظيفة والبريد
  if (p.title) lines.push(`TITLE:${p.title}`);
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${p.email}`);

  // أرقام الهاتف
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

  // واتساب
  if (p.whatsapp) {
    const wa = onlyDigitsPlus(p.whatsapp);
    if (wa) {
      lines.push(`item3.URL:https://wa.me/${wa}`);
      lines.push("item3.X-ABLabel:WhatsApp");
    }
  }

  // روابط السوشيال
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

  // النبذة (about)
  if (p.about) {
    const note = p.about.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    lines.push(`NOTE:${note}`);
  }

  // الصورة (Base64 أو رابط)
  if (p.photoBase64) {
    const [meta, b64raw] = (p.photoBase64 || "").split(",");
    const m = /data:image\/([a-zA-Z0-9+.-]+);base64/.exec(meta || "");
    const type = (m?.[1] || "JPEG").toUpperCase();
    const b64 = b64raw || extractBase64(p.photoBase64);
    if (b64) lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${b64}`);
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
// ProfileCard component (uses the local utils above)
// ===============================

export default function ProfileCard({ profile }) {
  const { t, lang } = useI18n()

  // اختيار النص المناسب حسب لغة الموقع
const T = (p, key, lang) =>
  (lang === 'ar' ? p[`${key}_ar`] : p[`${key}_en`]) ?? p[key] ?? ''

 const displayName  = T(profile, 'name',  lang)
 const displayTitle = T(profile, 'title', lang)
 const displayAbout = T(profile, 'about', lang)
const displayPhoneLabel  = T(profile, 'phoneLabel',  lang) || (lang === 'ar' ? 'الشخصي' : 'Personal')
const displayPhone2Label = T(profile, 'phone2Label', lang) || (lang === 'ar' ? 'العمل'   : 'Work')


   const { name, title, about, image, socials, cv, email,
   phone, phone2, whatsapp } = profile

  const tel1 = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : ''
  const tel2 = phone2 ? `tel:${phone2.replace(/[^\d+]/g, '')}` : ''
  const wa   = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}` : ''

  function handleDownloadCV() {
    if (!cv) {
      alert(lang === 'ar' ? 'لا يوجد ملف سيرة ذاتية مرفوع بعد' : 'No CV uploaded yet')
      return
    }
    const filename = `${(name || 'cv').replace(/\s+/g, '_')}.pdf`

    if (typeof cv === 'string' && cv.startsWith('data:application/pdf')) {
      try {
        const base64 = cv.split(',')[1]
        const byteString = atob(base64)
        const len = byteString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = byteString.charCodeAt(i)
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch (e) {
        console.error('Download (data URL) failed:', e)
        alert(lang === 'ar' ? 'تعذر تنزيل الملف. أعد رفع الـPDF من صفحة التعديل.' : 'Failed to download. Re-upload the PDF.')
      }
      return
    }

    const a = document.createElement('a')
    a.href = cv
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function handleDownloadContact() {
    downloadVCard({
      name,
      title,
      email,
      phone,
      phone2,
      phoneLabel:  displayPhoneLabel,
      phone2Label: displayPhone2Label,
      whatsapp,
      about,
      socials,
      photoBase64: image,
    }, `${(name || 'contact').replace(/\s+/g, '_')}.vcf`)
  }

  const [callOpen, setCallOpen] = useState(false)
  const callRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!callRef.current) return
      if (!callRef.current.contains(e.target)) setCallOpen(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setCallOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  function handleCallClick() {
    if (tel1 && !tel2) { window.location.href = tel1; return }
    if (!tel1 && tel2) { window.location.href = tel2; return }
    if (!tel1 && !tel2) return
    setCallOpen(v => !v)
  }

// QR state
const [qrDataUrl, setQrDataUrl] = useState('');

// توليد الـQR مرة واحدة عند التحميل
useEffect(() => {
  const profileUrl = window.location.href; // أو مسار ثابت لو عايز
  QRCode.toDataURL(profileUrl, {
    width: 240,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFFFF' }
  })
    .then(setQrDataUrl)
    .catch(console.error);
}, []);

// تحميل صورة الـQR
function downloadQR() {
  if (!qrDataUrl) return;
  const a = document.createElement('a');
  a.href = qrDataUrl;
  a.download = `${(name || 'profile')}_QR.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}


  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6 md:p-10"
    >
      <div className={`flex flex-col md:flex-row items-center md:items-start gap-8 ${lang === 'ar' ? 'rtl:text-right' : ''}`}>
        <motion.img
          src={image}
          alt={name}
          className="w-36 h-36 rounded-full object-cover ring-4 ring-white/70 shadow"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
        />

        <div className="flex-1">
          <motion.h1
            className="text-2xl md:text-3xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {t.hello} <span className="text-[color:var(--brand)]">{displayName}</span>

          </motion.h1>
          <p className="mt-1 font-semibold text-[color:var(--brand)]">{displayTitle}</p>
          <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">{displayAbout}</p>


          <SocialBar socials={socials} whatsapp={whatsapp} />

 {/* Actions + QR side-by-side */}
<div className={`mt-6 grid gap-6 md:grid-cols-[1fr_auto] items-start ${lang === 'ar' ? 'rtl:text-right' : ''}`}>

  {/* العمود الأول: الأزرار */}
  <div className="grid grid-cols-1 gap-3 btn-row">
    {cv ? (
      <button
        type="button"
        onClick={handleDownloadCV}
        className="btn btn-primary w-full min-w-0"
      >
        {t.download_cv}
      </button>
    ) : (
      <a href="/edit" className="btn btn-soft w-full min-w-0">
        {lang === 'ar' ? 'ارفع CV' : 'Upload CV'}
      </a>
    )}

    <button
      type="button"
      onClick={handleDownloadContact}
      className="btn btn-primary w-full min-w-0"
    >
      {t.download_contact}
    </button>

    {(tel1 || tel2) && (
      <div className="relative w-full" ref={callRef}>
        <button
          type="button"
          onClick={handleCallClick}
          aria-haspopup="menu"
          aria-expanded={callOpen}
          className="btn btn-primary btn-call w-full min-w-0"
        >
          {lang === 'ar' ? 'اتصل بي' : 'Call me'}
        </button>

        <AnimatePresence initial={false}>
          {callOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.15 }}
              role="menu"
              className={`call-menu absolute z-[90] mt-2 rounded-xl shadow-lg px-2 py-2 w-full ${
  lang === 'ar' ? 'right-0' : 'left-0'
}`}

            >
              {tel1 && (
                <a
                  href={tel1}
                  role="menuitem"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--bg-to)]"
                  onClick={() => setCallOpen(false)}
                >
                  <span>{displayPhoneLabel}</span>
                  <span className="opacity-70 ltr:ml-2 rtl:mr-2">{phone}</span>
                </a>
              )}
              {tel2 && (
                <a
                  href={tel2}
                  role="menuitem"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--bg-to)]"
                  onClick={() => setCallOpen(false)}
                >
                  <span>{displayPhone2Label}</span>
                  <span className="opacity-70 ltr:ml-2 rtl:mr-2">{phone2}</span>
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )}

    {email && (
      <a
        className="btn btn-primary w-full min-w-0"
        href={`mailto:${email}`}
        target="_blank"
        rel="noreferrer"
      >
        {lang === 'ar' ? 'أرسل بريدًا' : 'Send Email'}
      </a>
    )}
  </div>

  {/* العمود الثاني: QR + زر التحميل */}
  <div className="flex flex-col items-center md:items-end gap-2">
    <div className="p-3 rounded-xl border border-[var(--card-border)] bg-white shadow-sm">
      {/* خلفية بيضاء علشان الكود يقرا كويس على أي ثيم */}
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="Profile QR Code"
          className="w-40 h-40 object-contain"
          draggable="false"
        />
      ) : (
        <div className="w-40 h-40 grid place-items-center text-sm text-[var(--muted)]">
          {lang === 'ar' ? 'جاري توليد QR…' : 'Generating QR…'}
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={downloadQR}
      className="btn btn-soft min-w-[160px]"
    >
      {lang === 'ar' ? 'تحميل QR' : 'Download QR'}
    </button>
  </div>
</div>
        </div>
      </div>
    </motion.section>
  )
}

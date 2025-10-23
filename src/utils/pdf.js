// utils/pdf.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/** يحوّل رقم واتساب إلى wa.me */
const waLink = (phone) => phone ? `https://wa.me/${String(phone).replace(/[^\d]/g,'')}` : null;

/** EN PDF بنص وروابط قابلة للنقر */
export async function generateCV_EN(profile){
  const { name, title, email, phone, whatsapp, socials = {}, image } = profile;
  const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595 x 842 pt

  // هوامش
  const M = 56;
  let y = M;

  // صورة شخصية (اختياري)
  try{
    if (image && image.startsWith("data:image")) {
      doc.addImage(image, "JPEG", M, y, 90, 90, undefined, "FAST");
    }
  }catch{}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(name || "Your Name", M + 110, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(title || "Job Title", M + 110, y + 40);

  y += 110;

  // معلومات التواصل
  doc.setFont("helvetica", "bold");
  doc.text("Contact", M, y);
  doc.setFont("helvetica", "normal"); y += 18;

  if (email){
    doc.textWithLink(email, M, y, { url: `mailto:${email}` }); y += 16;
  }
  if (phone){
    doc.textWithLink(phone, M, y, { url: `tel:${phone}` }); y += 16;
  }
  if (whatsapp){
    const wa = waLink(whatsapp);
    if (wa){ doc.textWithLink("WhatsApp", M, y, { url: wa }); y += 16; }
  }

  const linkLine = (label, url) => {
    if (!url) return;
    doc.textWithLink(label, M, y, { url });
    y += 16;
  };

  // سوشيال
  doc.setFont("helvetica", "bold"); doc.text("Social", M, y + 10);
  doc.setFont("helvetica", "normal"); y += 28;

  linkLine("LinkedIn", socials.linkedin);
  linkLine("GitHub",   socials.github);
  linkLine("X",        socials.x);
  linkLine("Facebook", socials.facebook);
  linkLine("Instagram",socials.instagram);
  linkLine("YouTube",  socials.youtube);
  linkLine("TikTok",   socials.tiktok);

  // About (لو موجود)
  if (profile.about){
    y += 12;
    doc.setFont("helvetica", "bold"); doc.text("About", M, y); y += 18;
    doc.setFont("helvetica", "normal");
    const text = doc.splitTextToSize(profile.about, 595 - 2*M);
    doc.text(text, M, y);
  }

  doc.save(`${(name || "cv").replace(/\s+/g,'_')}.pdf`);
}

/** AR PDF: يلتقط Preview HTML ليحافظ على الخط والـRTL (روابط قد لا تكون قابلة للنقر) */
export async function generateCV_AR(previewNode, fileName="السيرة_الذاتية.pdf"){
  const canvas = await html2canvas(previewNode, { backgroundColor: null, scale: 2 });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // ملاءمة الصورة لصفحة A4
  const imgWidth = pageWidth - 56*2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(img, "PNG", 56, 56, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(fileName);
}

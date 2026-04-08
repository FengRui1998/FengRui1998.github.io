const requestForm = document.getElementById("requestForm");
const submitApplication = document.getElementById("submitApplication");

function sanitizeFilePart(value) {
  return (value || "applicant")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40) || "applicant";
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function buildPdfFromJpeg(jpegBytes, width, height) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let position = 0;

  const pushString = (value) => {
    const bytes = encoder.encode(value);
    parts.push(bytes);
    position += bytes.length;
  };

  const pushBytes = (bytes) => {
    parts.push(bytes);
    position += bytes.length;
  };

  pushString("%PDF-1.3\n");
  offsets.push(position);
  pushString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets.push(position);
  pushString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  offsets.push(position);
  pushString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
  offsets.push(position);
  pushString(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  pushBytes(jpegBytes);
  pushString("\nendstream\nendobj\n");
  const contentStream = "q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n";
  const contentBytes = encoder.encode(contentStream);
  offsets.push(position);
  pushString(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  const xrefOffset = position;
  pushString(`xref\n0 ${offsets.length}\n`);
  pushString("0000000000 65535 f \n");

  for (let i = 1; i < offsets.length; i += 1) {
    pushString(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  pushString(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

function drawDottedLine(ctx, x1, x2, y) {
  ctx.save();
  ctx.strokeStyle = "#5f6678";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawCheckbox(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "#2f7d6b";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, 24, 24);
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 13);
  ctx.lineTo(x + 10, y + 18);
  ctx.lineTo(x + 19, y + 7);
  ctx.stroke();
  ctx.restore();
}

function renderApplicationCanvas(formData) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const leftLabelX = 78;
  const valueX = 400;
  const valueRight = 1120;
  let y = 120;

  ctx.fillStyle = "#111111";
  ctx.font = "700 30px Montserrat, Arial, sans-serif";
  ctx.fillText("CogPic Dataset Application Form", leftLabelX, 68);

  const topFields = [
    ["Applicant Name", formData.applicantName],
    ["Institution", formData.institution],
    ["Email (Institutional Email)", formData.institutionalEmail],
    ["Supervisor Name", formData.supervisorName],
    ["Researcher 1", formData.researcher1],
    ["Researcher 2", formData.researcher2],
    ["Researcher 3", formData.researcher3],
    ["Researcher 4", formData.researcher4],
  ];

  topFields.forEach(([label, value]) => {
    ctx.fillStyle = "#222222";
    ctx.font = "600 21px Montserrat, Arial, sans-serif";
    ctx.fillText(label, leftLabelX, y);

    drawDottedLine(ctx, valueX, valueRight, y + 8);

    ctx.fillStyle = "#1098e6";
    ctx.font = "500 22px Montserrat, Arial, sans-serif";
    const lines = wrapText(ctx, value, valueRight - valueX - 8);
    lines.forEach((line, index) => {
      ctx.fillText(line, valueX + 4, y - 7 + index * 30);
    });

    y += Math.max(58, lines.length * 30 + 20);
  });

  y += 30;
  ctx.fillStyle = "#111111";
  ctx.font = "700 26px Montserrat, Arial, sans-serif";
  ctx.fillText("Confirmed Agreements", leftLabelX, y);

  const agreements = [
    "I have read and agree to the terms and conditions listed on the CogPic database website.",
    "This database is for research purposes only.",
    "I will not provide any part of this database to any third party.",
    "I will not sell any part of this database or use it for profit.",
  ];

  y += 44;
  agreements.forEach((text) => {
    drawCheckbox(ctx, leftLabelX, y - 22);
    ctx.fillStyle = "#222222";
    ctx.font = "400 21px Montserrat, Arial, sans-serif";
    const lines = wrapText(ctx, text, valueRight - leftLabelX - 56);
    lines.forEach((line, index) => {
      ctx.fillText(line, leftLabelX + 40, y + index * 28);
    });
    y += lines.length * 28 + 24;
  });

  y += 110;

  const bottomGroups = [
    ["Applicant Signature", "", 78, 410],
    ["Supervisor Signature", "", 480, 810],
    ["Date", formData.submissionDate, 880, 1120],
  ];

  bottomGroups.forEach(([label, value, startX, endX]) => {
    ctx.fillStyle = "#222222";
    ctx.font = "600 21px Montserrat, Arial, sans-serif";
    ctx.fillText(label, startX, y);
    drawDottedLine(ctx, startX, endX, y + 52);
    ctx.fillStyle = "#1098e6";
    ctx.font = "500 22px Montserrat, Arial, sans-serif";
    const lines = wrapText(ctx, value, endX - startX - 8);
    lines.forEach((line, index) => {
      ctx.fillText(line, startX + 4, y + 38 + index * 28);
    });
  });

  y += 130;
  ctx.fillStyle = "#6a6b85";
  ctx.font = "400 18px Montserrat, Arial, sans-serif";
  ctx.fillText("Generated automatically from the CogPic application page.", leftLabelX, y);

  return canvas;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

if (requestForm && submitApplication) {
  const emailField = requestForm.elements.institutional_email;
  const emailHint = document.getElementById("institutionalEmailHint");
  const dateField = requestForm.elements.submission_date;

  if (dateField && !dateField.value) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateField.value = `${year}-${month}-${day}`;
  }

  const updateEmailHint = () => {
    if (!emailField || !emailHint) {
      return;
    }

    const value = emailField.value.trim();
    emailHint.classList.remove("is-error", "is-valid");

    if (!value) {
      emailHint.textContent = "Please enter a valid institutional email address.";
      return;
    }

    if (emailField.validity.typeMismatch) {
      emailHint.textContent = "Invalid email format. Example: name@university.edu.cn";
      emailHint.classList.add("is-error");
      return;
    }

    emailHint.textContent = "Email format looks correct.";
    emailHint.classList.add("is-valid");
  };

  const syncSubmitState = () => {
    submitApplication.disabled = !requestForm.checkValidity();
  };

  requestForm.addEventListener("input", syncSubmitState);
  requestForm.addEventListener("change", syncSubmitState);
  requestForm.addEventListener("input", updateEmailHint);
  requestForm.addEventListener("change", updateEmailHint);

  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!requestForm.checkValidity()) {
      syncSubmitState();
      requestForm.reportValidity();
      return;
    }

    const dateValue = requestForm.elements.submission_date.value;
    const formattedDate = dateValue
      ? new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-CA")
      : "";

    const formData = {
      applicantName: requestForm.elements.applicant_name.value.trim(),
      institution: requestForm.elements.institution.value.trim(),
      institutionalEmail: requestForm.elements.institutional_email.value.trim(),
      supervisorName: requestForm.elements.supervisor_name.value.trim(),
      researcher1: requestForm.elements.researcher_1.value.trim(),
      researcher2: requestForm.elements.researcher_2.value.trim(),
      researcher3: requestForm.elements.researcher_3.value.trim(),
      researcher4: requestForm.elements.researcher_4.value.trim(),
      submissionDate: formattedDate,
    };

    submitApplication.disabled = true;
    submitApplication.textContent = "Generating PDF...";

    try {
      const canvas = renderApplicationCanvas(formData);
      const jpegBytes = dataUrlToUint8Array(canvas.toDataURL("image/jpeg", 0.92));
      const pdfBlob = buildPdfFromJpeg(jpegBytes, canvas.width, canvas.height);
      const filename = `CogPic_Application_${sanitizeFilePart(formData.applicantName)}.pdf`;
      downloadBlob(pdfBlob, filename);
      submitApplication.textContent = "PDF Downloaded";
    } catch (error) {
      console.error("Failed to generate application PDF.", error);
      submitApplication.textContent = "Download Failed";
    } finally {
      window.setTimeout(() => {
        submitApplication.textContent = "Submit Application";
        syncSubmitState();
      }, 1600);
    }
  });

  updateEmailHint();
  syncSubmitState();
}

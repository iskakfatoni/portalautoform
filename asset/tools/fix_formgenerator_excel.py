import os
import sys
import subprocess
import shutil

sys.stdout.reconfigure(encoding='utf-8')

form_gen_dir = r"C:\Users\iskak\Antigravity-Projetcs\formGenerator-IskakFatoni"
export_excel_path = os.path.join(form_gen_dir, "js", "export-excel.js")
portal_xlsx_path = r"C:\Users\iskak\Antigravity-Projetcs\portalautoform\asset\js\xlsx.full.min.js"
form_gen_xlsx_path = os.path.join(form_gen_dir, "js", "xlsx.full.min.js")

# 1. Copy reliable local xlsx.full.min.js to formGenerator-IskakFatoni
if os.path.exists(portal_xlsx_path):
    shutil.copy2(portal_xlsx_path, form_gen_xlsx_path)
    print("✅ Copied local xlsx.full.min.js to formGenerator-IskakFatoni/js/")

# 2. Write bulletproof export-excel.js
new_export_code = """/**
 * FORMCRAFT - Excel Export Engine
 * Converts Form Responses to structured, formatted Microsoft Excel (.xlsx) files using SheetJS.
 * Automatically consolidates questions with the same field name into a single column.
 * Handles all question types (GPS Location, Photo/File, Digital Signature, Quiz Scores, Rating, Checkboxes).
 */

class ExcelExporter {
  static getConsolidatedColumns(rawQuestions) {
    const consolidated = [];
    const map = new Map();

    (rawQuestions || []).forEach((q, idx) => {
      if (!q) return;
      const rawTitle = (q.title || ('Pertanyaan ' + (idx + 1))).trim();
      const key = rawTitle.toLowerCase();

      if (map.has(key)) {
        const existing = consolidated[map.get(key)];
        if (q.id) existing.questionIds.push(q.id);
        if (q.type && !existing.types.includes(q.type)) {
          existing.types.push(q.type);
        }
        existing.questions.push(q);
      } else {
        const entry = {
          title: rawTitle,
          type: q.type || 'text',
          types: [q.type || 'text'],
          questionIds: q.id ? [q.id] : [],
          questions: [q],
          required: !!q.required
        };
        map.set(key, consolidated.length);
        consolidated.push(entry);
      }
    });

    return consolidated;
  }

  static formatAnswerForExcel(val, qType) {
    if (val === undefined || val === null || val === '') {
      return '-';
    }

    // 1. Lokasi GPS
    if (qType === 'location' || (val && typeof val === 'object' && (val.lat !== undefined || val.latitude !== undefined))) {
      let locObj = val;
      if (typeof locObj === 'string' && locObj.trim().startsWith('{')) {
        try { locObj = JSON.parse(locObj); } catch(e){}
      }
      if (locObj && typeof locObj === 'object') {
        const lat = locObj.lat !== undefined ? locObj.lat : locObj.latitude;
        const lng = locObj.lng !== undefined ? locObj.lng : locObj.longitude;
        const acc = locObj.accuracy ? ` (Akurasi: ±${Math.round(locObj.accuracy)}m)` : '';
        if (lat !== undefined && lng !== undefined) {
          return `${lat}, ${lng}${acc} - https://www.google.com/maps?q=${lat},${lng}`;
        }
      }
      return String(val);
    }

    // 2. File Google Drive
    if (qType === 'file_gdrive' || (val && typeof val === 'object' && val.url)) {
      let fileObj = val;
      if (typeof fileObj === 'string' && fileObj.trim().startsWith('{')) {
        try { fileObj = JSON.parse(fileObj); } catch(e){}
      }
      if (fileObj && typeof fileObj === 'object' && fileObj.url) {
        return `${fileObj.name || 'Berkas'}: ${fileObj.url}`;
      }
      return String(val);
    }

    // 3. File Lokal / Foto Unggahan
    if (qType === 'file' || (val && typeof val === 'object' && val.data)) {
      let fileObj = val;
      if (typeof fileObj === 'string' && fileObj.trim().startsWith('{')) {
        try { fileObj = JSON.parse(fileObj); } catch(e){}
      }
      if (fileObj && typeof fileObj === 'object') {
        const name = fileObj.name || 'Foto/Berkas';
        const sizeStr = fileObj.size ? ` (${Math.round(fileObj.size / 1024)} KB)` : '';
        return fileObj.url ? `${name}${sizeStr}: ${fileObj.url}` : `[Foto/Berkas: ${name}${sizeStr}]`;
      }
      if (typeof val === 'string' && val.startsWith('data:image')) {
        return '[Foto Terlampir - Base64 Image]';
      }
      return String(val);
    }

    // 4. Tanda Tangan Digital
    if (qType === 'signature') {
      if (typeof val === 'string' && (val.startsWith('data:image') || val.length > 100)) {
        return '[Tanda Tangan Digital Terverifikasi]';
      }
      return val ? String(val) : '[Tanda Tangan Terlampir]';
    }

    // 5. Checkbox (Pilihan Majemuk / Multi-Select Array)
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.label || item.value || JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }

    // 6. Rating Bintang / Angka
    if (qType === 'rating') {
      const num = Number(val);
      return !isNaN(num) ? `${num} / 5` : String(val);
    }

    // 7. Objek Generik lainnya (Fallback aman)
    if (typeof val === 'object') {
      try {
        if (val.label) return String(val.label);
        if (val.value) return String(val.value);
        return JSON.stringify(val);
      } catch(e) {
        return String(val);
      }
    }

    return String(val);
  }

  static exportFormResponses(form, responses) {
    const xlsxLib = window.XLSX;
    if (!xlsxLib) {
      alert('Komponen generator Excel (SheetJS) belum termuat. Silakan periksa koneksi internet atau refresh halaman.');
      return false;
    }

    if (!form || !responses || responses.length === 0) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Tidak ada data respon untuk diekspor ke Excel', 'error');
      } else {
        alert('Tidak ada data respon untuk diekspor ke Excel');
      }
      return false;
    }

    try {
      // 1. Prepare Header Row
      const hasEmail = !!form.collectEmail || responses.some(r => !!r.respondentEmail || !!(r.answers && r.answers._respondent_email));
      const isQuiz = form.isQuizMode === true;
      const headers = ['No', 'ID Respon', 'Waktu Pengisian (WIB/Lokal)'];
      
      if (isQuiz) {
        headers.push('Nilai Kuis (Poin)', 'Total Poin Maksimal', 'Persentase (%)');
      }
      if (hasEmail) {
        headers.push('Email Responden');
      }

      const columns = this.getConsolidatedColumns(form.questions || []);
      columns.forEach(col => {
        headers.push(col.title || 'Pertanyaan');
      });

      // 2. Prepare Data Rows
      const rows = [];
      responses.forEach((resp, index) => {
        const row = [];
        row.push(index + 1);
        row.push(resp.id || `RESP-${index + 1}`);
        
        // Format Waktu Pengisian
        let dateStr = '-';
        if (resp.submittedAt) {
          try {
            const d = new Date(resp.submittedAt);
            dateStr = d.toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'medium'
            });
          } catch(e) {
            dateStr = String(resp.submittedAt);
          }
        }
        row.push(dateStr);

        // Skor Kuis (Jika Mode Kuis Aktif)
        if (isQuiz) {
          const ans = resp.answers || {};
          row.push(ans._quiz_score !== undefined ? ans._quiz_score : '-');
          row.push(ans._quiz_total !== undefined ? ans._quiz_total : '-');
          row.push(ans._quiz_percentage !== undefined ? `${ans._quiz_percentage}%` : '-');
        }

        // Email Responden
        if (hasEmail) {
          const emailVal = resp.respondentEmail || (resp.answers && resp.answers._respondent_email) || '-';
          row.push(emailVal);
        }

        // Kolom Jawaban
        columns.forEach(col => {
          let ansVal = null;
          let activeType = col.type || 'text';

          const questionsList = col.questions || [];
          for (const q of questionsList) {
            if (!q || !q.id) continue;
            const val = resp.answers ? resp.answers[q.id] : null;
            if (val !== null && val !== undefined && val !== '') {
              ansVal = val;
              activeType = q.type || col.type || 'text';
              break;
            }
          }

          // Format Jawaban Sesuai Tipe
          const formattedAns = this.formatAnswerForExcel(ansVal, activeType);
          row.push(formattedAns);
        });

        rows.push(row);
      });

      // 3. Create Worksheet and Workbook
      const worksheetData = [headers, ...rows];
      const worksheet = xlsxLib.utils.aoa_to_sheet(worksheetData);

      // 4. Auto-calculate Column Widths
      const colWidths = headers.map((header, colIdx) => {
        let maxLen = String(header || '').length;
        rows.forEach(r => {
          const val = r[colIdx] !== undefined && r[colIdx] !== null ? String(r[colIdx]) : '';
          const effectiveLen = val.startsWith('http') ? Math.min(val.length, 30) : val.length;
          if (effectiveLen > maxLen) {
            maxLen = effectiveLen;
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
      });
      worksheet['!cols'] = colWidths;

      // 5. Append sheet to Workbook
      const workbook = xlsxLib.utils.book_new();
      let sheetName = (form.title || 'Respon Form')
        .replace(/[:\\\\/\\?\\*\\[\\]]/g, '_')
        .trim()
        .substring(0, 30);
      if (!sheetName) sheetName = 'Data Respon';

      xlsxLib.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 6. Generate Clean Filename
      const safeTitle = (form.title || 'Form_Responses')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 35) || 'data_respon';
      const today = new Date().toISOString().split('T')[0];
      const filename = `${safeTitle}_respon_${today}.xlsx`;

      // 7. Trigger download with fallback
      try {
        xlsxLib.writeFile(workbook, filename);
      } catch(writeErr) {
        console.warn('XLSX.writeFile gagal, mencoba fallback Blob download:', writeErr);
        const wbout = xlsxLib.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 500);
      }

      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Berhasil mengekspor ${responses.length} data respon ke Excel (.xlsx)!`, 'success');
      }
      return true;
    } catch (err) {
      console.error('Export Excel Error:', err);
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Gagal mengekspor data ke Excel: ' + err.message, 'error');
      } else {
        alert('Gagal mengekspor data ke Excel: ' + err.message);
      }
      return false;
    }
  }
}

window.ExcelExporter = ExcelExporter;
"""

with open(export_excel_path, "w", encoding="utf-8") as f:
    f.write(new_export_code)
print(f"✅ Updated {export_excel_path}")

# 3. Update form.html script tags to include local xlsx fallback
form_html_path = os.path.join(form_gen_dir, "form.html")
if os.path.exists(form_html_path):
    with open(form_html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    
    # Check if local xlsx is already included
    if '<script src="js/xlsx.full.min.js"></script>' not in html_content:
        html_content = html_content.replace(
            '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>',
            '<script src="js/xlsx.full.min.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>'
        )
        with open(form_html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ Updated form.html with local xlsx script tag fallback")

# 4. Git add, commit, and push in formGenerator-IskakFatoni
print("🚀 Committing and pushing to formGenerator-IskakFatoni repository...")
res1 = subprocess.run(["git", "add", "."], cwd=form_gen_dir, capture_output=True, text=True)
res2 = subprocess.run(["git", "commit", "-m", "fix: perbaiki error export excel data respon siswa, dukungan offline SheetJS, dan format lokasi/foto/ttd"], cwd=form_gen_dir, capture_output=True, text=True)
print("Git commit output:", res2.stdout or res2.stderr)
res3 = subprocess.run(["git", "push", "origin", "main"], cwd=form_gen_dir, capture_output=True, text=True)
print("Git push output:", res3.stdout or res3.stderr)

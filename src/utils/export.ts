import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Competitor, CourseTimeConfig, Size } from '../types/index.ts';
import { SIZES, SIZE_LABELS } from '../constants/index.ts';
import { rankCompetitors } from './scoring.ts';

export function exportExcel(competitors: Competitor[], courseTimeConfig: CourseTimeConfig, rounds: readonly string[]) {
  const wb = XLSX.utils.book_new();

  rounds.forEach((round) => {
    const data = competitors
      .filter((c) => c.round === round)
      .sort((a, b) => a.size.localeCompare(b.size) || a.order - b.order);
    if (!data.length) return;

    const ct = courseTimeConfig[round] ?? { sct: 0, mct: 0 };
    const rows: (string | number | null)[][] = [];
    rows.push(['Round:', round]);
    rows.push(['SCT:', ct.sct, 'MCT:', ct.mct]);
    rows.push([]);
    rows.push([
      'Rank', 'Size', 'Order', 'Dog', 'Breed', 'Handler',
      'C.Faults', 'Refusals', 'T.Faults', 'Total Faults', 'Time', 'Status',
    ]);

    SIZES.forEach((sz) => {
      const szData = data.filter((c) => c.size === sz);
      const ranked = rankCompetitors(szData);
      ranked.forEach((c) => {
        const status = c.eliminated ? 'Eliminated' : c.totalFault !== null ? 'Done' : 'Pending';
        rows.push([
          c.rank ?? '—', c.size, c.order, c.dog, c.breed ?? '', c.human,
          c.fault ?? '', c.refusal ?? '', c.timeFault ?? '', c.totalFault ?? '',
          c.time ?? '', status,
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
      { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 8 }, { wch: 10 },
    ];
    const safeName = round.replace(/[\\/?*[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  XLSX.writeFile(wb, 'PawsAndSpeed_Results.xlsx');
}

export function exportJSON(competitors: Competitor[], courseTimeConfig: CourseTimeConfig) {
  const payload = { competitors, courseTimeConfig, exportDate: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PawsAndSpeed_Backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importJSON(
  file: File,
  onSuccess: (data: { competitors: Competitor[]; courseTimeConfig: CourseTimeConfig }) => void,
  onError: () => void
) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target?.result as string);
      if (d.competitors) {
        onSuccess({ competitors: d.competitors, courseTimeConfig: d.courseTimeConfig });
      } else {
        onError();
      }
    } catch {
      onError();
    }
  };
  reader.readAsText(file);
}

export function exportPDF(competitors: Competitor[], courseTimeConfig: CourseTimeConfig, rounds: readonly string[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  let first = true;

  rounds.forEach((round) => {
    const ct = courseTimeConfig[round] ?? { sct: 0, mct: 0 };

    SIZES.forEach((sz) => {
      const data = competitors.filter((c) => c.round === round && c.size === sz);
      if (!data.length) return;

      if (!first) doc.addPage();
      first = false;

      doc.setFontSize(16);
      doc.text(`Paws & Speed — ${round}`, 14, 15);
      doc.setFontSize(11);
      doc.text(`Size: ${SIZE_LABELS[sz]} (${sz})  |  SCT: ${ct.sct}s  |  MCT: ${ct.mct}s`, 14, 23);

      const ranked = rankCompetitors(data);
      const tableData = ranked.map((c) => [
        c.rank ?? '—',
        c.size,
        c.order,
        c.dog,
        c.breed ?? '',
        c.human,
        c.eliminated ? '—' : (c.fault ?? ''),
        c.eliminated ? '—' : (c.refusal ?? ''),
        c.eliminated ? '—' : (c.timeFault ?? ''),
        c.eliminated ? '—' : (c.totalFault ?? ''),
        c.time !== null ? c.time.toFixed(2) + 's' : '',
        c.eliminated ? 'ELIM' : c.totalFault !== null ? 'Done' : 'Pending',
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Rank', 'Size', '#', 'Dog', 'Breed', 'Handler', 'C.F', 'Ref', 'T.F', 'Total', 'Time', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 44] },
        styles: { fontSize: 9 },
      });
    });
  });

  doc.save('PawsAndSpeed_Results.pdf');
}

const SIZE_COLORS: Record<string, string> = {
  S: '#f472b6', M: '#60a5fa', I: '#34d399', L: '#fbbf24',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function exportSharePNG(
  round: string,
  size: Size,
  competitors: Competitor[],
  courseTimeConfig: CourseTimeConfig
): void {
  const data = competitors
    .filter((c) => c.round === round && c.size === size)
    .sort((a, b) => a.order - b.order);

  if (!data.length) return;

  const ct = courseTimeConfig[round] ?? { sct: 0, mct: 0 };
  const sizeColor = SIZE_COLORS[size] ?? '#f0f2f8';
  const sizeLabel = SIZE_LABELS[size] ?? size;

  const W = 520;
  const HEADER_H = 104;
  const ROW_H = 44;
  const FOOTER_H = 40;
  const height = HEADER_H + data.length * ROW_H + FOOTER_H;
  const DPR = 2;

  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = height * DPR;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);

  // Background
  ctx.fillStyle = '#0c0e12';
  ctx.fillRect(0, 0, W, height);

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(255,107,44,0.18)');
  grad.addColorStop(1, 'rgba(255,107,44,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Left accent bar
  ctx.fillStyle = '#ff6b2c';
  ctx.fillRect(0, 0, 3, HEADER_H);

  // Brand
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ff6b2c';
  ctx.fillText('PAWS & SPEED', 18, 24);

  // Round name
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f0f2f8';
  ctx.fillText(round.toUpperCase(), 18, 52);

  // Size badge
  ctx.fillStyle = `${sizeColor}22`;
  roundRect(ctx, 18, 62, 118, 24, 6);
  ctx.fill();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = sizeColor;
  ctx.fillText(`${size}  ·  ${sizeLabel}`, 28, 78);

  // SCT / MCT
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#8b90a5';
  ctx.fillText(`SCT ${ct.sct}s  ·  MCT ${ct.mct}s`, 148, 78);

  // Header divider
  ctx.fillStyle = 'rgba(42,47,64,0.8)';
  ctx.fillRect(0, HEADER_H, W, 1);

  // Rows
  data.forEach((c, i) => {
    const y = HEADER_H + i * ROW_H;

    // Alternating row bg
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.018)';
      ctx.fillRect(0, y, W, ROW_H);
    }

    // Row divider
    if (i > 0) {
      ctx.fillStyle = 'rgba(42,47,64,0.35)';
      ctx.fillRect(16, y, W - 32, 1);
    }

    const centerY = y + ROW_H / 2;

    // Order #
    ctx.font = 'bold 13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#ff6b2c';
    const orderStr = String(c.order).padStart(2, ' ');
    ctx.fillText(orderStr, 18, centerY + 5);

    // Size dot
    ctx.fillStyle = SIZE_COLORS[c.size] ?? sizeColor;
    ctx.beginPath();
    ctx.arc(56, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dog name
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f0f2f8';
    ctx.fillText(c.dog, 70, centerY - 3);

    // Breed
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#555b73';
    ctx.fillText(c.breed || '', 70, centerY + 13);

    // Handler (right-aligned)
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8b90a5';
    const handlerW = ctx.measureText(c.human).width;
    ctx.fillText(c.human, W - 18 - handlerW, centerY - 3);

    // Status / score (right-aligned, below handler)
    if (c.eliminated) {
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ef4444';
      const elimW = ctx.measureText('ELIM').width;
      ctx.fillText('ELIM', W - 18 - elimW, centerY + 13);
    } else if (c.totalFault !== null && c.time !== null) {
      const scoreStr = `${c.totalFault}F  ${c.time.toFixed(2)}s`;
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillStyle = c.totalFault === 0 ? '#2dd4a0' : '#ff6b2c';
      const scoreW = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, W - 18 - scoreW, centerY + 13);
    }
  });

  // Footer
  const footerY = HEADER_H + data.length * ROW_H;
  ctx.fillStyle = 'rgba(42,47,64,0.5)';
  ctx.fillRect(0, footerY, W, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, footerY, W, FOOTER_H);

  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#555b73';
  ctx.fillText('paws-and-speed', 18, footerY + 25);

  const dateStr = new Date().toLocaleDateString();
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, W - 18 - dateW, footerY + 25);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PawsAndSpeed_${round.replace(/\s+/g, '_')}_${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EventCompetitor, EventRound } from '../types/supabase.ts';
import type { Size } from '../types/index.ts';
import { SIZES, SIZE_LABELS, dogEmoji } from '../constants/index.ts';
import { rankCompetitors } from './scoring.ts';

export function exportExcel(competitors: EventCompetitor[], rounds: EventRound[]) {
  const wb = XLSX.utils.book_new();

  rounds.forEach((round) => {
    const data = competitors
      .filter((c) => c.round_id === round.id)
      .sort((a, b) => a.size.localeCompare(b.size) || a.run_order - b.run_order);
    if (!data.length) return;

    const rows: (string | number | null)[][] = [];
    rows.push(['Round:', round.name]);
    rows.push(['SCT:', round.sct, 'MCT:', round.mct]);
    rows.push([]);
    rows.push([
      'Rank', 'Size', 'Order', 'Dog', 'Breed', 'Handler',
      'C.Faults', 'Refusals', 'T.Faults', 'Total Faults', 'Time', 'Status',
    ]);

    SIZES.forEach((sz) => {
      const szData = data.filter((c) => c.size === sz);
      const ranked = rankCompetitors(szData);
      ranked.forEach((c) => {
        const status = c.eliminated ? 'Eliminated' : c.total_fault !== null ? 'Done' : 'Pending';
        rows.push([
          c.rank ?? '—', c.size, c.run_order, c.dog_name, c.breed ?? '', c.human_name,
          c.fault ?? '', c.refusal ?? '', c.time_fault ?? '', c.total_fault ?? '',
          c.time_sec ?? '', status,
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
      { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 8 }, { wch: 10 },
    ];
    const safeName = round.name.replace(/[\\/?*[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  XLSX.writeFile(wb, 'PawsAndSpeed_Results.xlsx');
}

export function exportJSON(competitors: EventCompetitor[], rounds: EventRound[]) {
  const payload = { competitors, rounds, exportDate: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PawsAndSpeed_Backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPDF(competitors: EventCompetitor[], rounds: EventRound[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  let first = true;

  rounds.forEach((round) => {
    SIZES.forEach((sz) => {
      const data = competitors.filter((c) => c.round_id === round.id && c.size === sz);
      if (!data.length) return;

      if (!first) doc.addPage();
      first = false;

      doc.setFontSize(16);
      doc.text(`Paws & Speed — ${round.name}`, 14, 15);
      doc.setFontSize(11);
      doc.text(`Size: ${SIZE_LABELS[sz]} (${sz})  |  SCT: ${round.sct}s  |  MCT: ${round.mct}s`, 14, 23);

      const ranked = rankCompetitors(data);
      const tableData = ranked.map((c) => [
        c.rank ?? '—',
        c.size,
        c.run_order,
        c.dog_name,
        c.breed ?? '',
        c.human_name,
        c.eliminated ? '—' : (c.fault ?? ''),
        c.eliminated ? '—' : (c.refusal ?? ''),
        c.eliminated ? '—' : (c.time_fault ?? ''),
        c.eliminated ? '—' : (c.total_fault ?? ''),
        c.time_sec !== null ? c.time_sec.toFixed(2) + 's' : '',
        c.eliminated ? 'ELIM' : c.total_fault !== null ? 'Done' : 'Pending',
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
  round: EventRound,
  size: Size,
  competitors: EventCompetitor[]
): void {
  const data = competitors.filter((c) => c.round_id === round.id && c.size === size);
  if (!data.length) return;

  const ranked = rankCompetitors(data);
  const sizeColor = SIZE_COLORS[size] ?? '#f0f2f8';
  const sizeLabel = SIZE_LABELS[size] ?? size;

  const W = 600;
  const HEADER_H = 96;

  const top3 = ranked.filter((c) => c.rank !== null).slice(0, 3);
  const hasPodium = top3.length >= 3;
  const PODIUM_H = hasPodium ? 230 : 0;

  const TABLE_HDR_H = 32;
  const ROW_H = 42;
  const FOOTER_H = 40;
  const height = HEADER_H + PODIUM_H + TABLE_HDR_H + ranked.length * ROW_H + FOOTER_H;

  const DPR = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = height * DPR;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);

  // ── Background
  ctx.fillStyle = '#0c0e12';
  ctx.fillRect(0, 0, W, height);

  // ── Header
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(255,107,44,0.18)');
  grad.addColorStop(1, 'rgba(255,107,44,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  ctx.fillStyle = '#ff6b2c';
  ctx.fillRect(0, 0, 3, HEADER_H);

  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ff6b2c';
  ctx.fillText('PAWS & SPEED', 18, 24);

  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f0f2f8';
  ctx.fillText(round.name.toUpperCase(), 18, 52);

  ctx.fillStyle = `${sizeColor}22`;
  roundRect(ctx, 18, 62, 118, 24, 6);
  ctx.fill();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = sizeColor;
  ctx.fillText(`${size}  ·  ${sizeLabel}`, 28, 78);

  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#8b90a5';
  ctx.fillText(`SCT ${round.sct}s  ·  MCT ${round.mct}s`, 148, 78);

  ctx.fillStyle = 'rgba(42,47,64,0.8)';
  ctx.fillRect(0, HEADER_H, W, 1);

  // ── Podium
  if (hasPodium) {
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumColors = ['#94a3b8', '#fbbf24', '#d97706'];
    const placeLabels = ['2', '1', '3'];
    const barHeights = [68, 90, 50];
    const colCenters = [W / 4, W / 2, (W * 3) / 4];
    const BAR_W = 110;
    const FLOOR_Y = HEADER_H + PODIUM_H - 20;

    function truncate(text: string, maxW: number): string {
      if (ctx.measureText(text).width <= maxW) return text;
      let s = text;
      while (s.length > 0 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }

    podiumOrder.forEach((c, i) => {
      const color = podiumColors[i];
      const barH = barHeights[i];
      const cx = colCenters[i];
      const barX = cx - BAR_W / 2;
      const barY = FLOOR_Y - barH;

      ctx.fillStyle = `${color}22`;
      roundRect(ctx, barX, barY, BAR_W, barH, 8);
      ctx.fill();
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 1;
      roundRect(ctx, barX, barY, BAR_W, barH, 8);
      ctx.stroke();

      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(placeLabels[i], cx, barY + barH / 2 + 9);

      let iy = barY - 8;

      ctx.font = '10px "Courier New", Courier, monospace';
      ctx.fillStyle = '#555b73';
      ctx.fillText(`${c.total_fault}F · ${c.time_sec?.toFixed(2)}s`, cx, iy);
      iy -= 17;

      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#8b90a5';
      ctx.fillText(truncate(c.human_name, BAR_W - 8), cx, iy);
      iy -= 17;

      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f0f2f8';
      ctx.fillText(truncate(c.dog_name, BAR_W - 8), cx, iy);
      iy -= 10;

      const AVATAR_R = 24;
      const avatarCy = iy - AVATAR_R;
      ctx.beginPath();
      ctx.arc(cx, avatarCy, AVATAR_R, 0, Math.PI * 2);
      ctx.fillStyle = `${color}1a`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f0f2f8';
      ctx.fillText(c.icon || dogEmoji(c.dog_name), cx, avatarCy + 7);

      ctx.textAlign = 'left';
    });

    ctx.fillStyle = 'rgba(42,47,64,0.5)';
    ctx.fillRect(0, HEADER_H + PODIUM_H, W, 1);
  }

  // ── Results table
  const tableY = HEADER_H + PODIUM_H;
  const cols = [
    { label: 'Rank',    x: 16  },
    { label: 'Dog',     x: 60  },
    { label: 'Handler', x: 215 },
    { label: 'C.F',     x: 338 },
    { label: 'Ref',     x: 381 },
    { label: 'T.F',     x: 424 },
    { label: 'Total F', x: 467 },
    { label: 'Time',    x: 524 },
  ];

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, tableY, W, TABLE_HDR_H);
  cols.forEach((col) => {
    ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#555b73';
    ctx.textAlign = 'left';
    ctx.fillText(col.label.toUpperCase(), col.x, tableY + 20);
  });
  ctx.fillStyle = 'rgba(42,47,64,0.8)';
  ctx.fillRect(0, tableY + TABLE_HDR_H, W, 1);

  ranked.forEach((c, i) => {
    const ry = tableY + TABLE_HDR_H + i * ROW_H;

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.018)';
      ctx.fillRect(0, ry, W, ROW_H);
    }
    if (i > 0) {
      ctx.fillStyle = 'rgba(42,47,64,0.35)';
      ctx.fillRect(16, ry, W - 32, 1);
    }

    const cy = ry + ROW_H / 2 + 5;
    ctx.textAlign = 'left';

    if (c.rank === 1 || c.rank === 2 || c.rank === 3) {
      const medalColor = c.rank === 1 ? '#fbbf24' : c.rank === 2 ? '#94a3b8' : '#d97706';
      const BADGE_R = 11;
      const bx = cols[0].x + BADGE_R;
      const by = cy - 5;
      ctx.beginPath();
      ctx.arc(bx, by, BADGE_R, 0, Math.PI * 2);
      ctx.fillStyle = `${medalColor}28`;
      ctx.fill();
      ctx.strokeStyle = medalColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `bold 11px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = medalColor;
      ctx.textAlign = 'center';
      ctx.fillText(String(c.rank), bx, by + 4);
      ctx.textAlign = 'left';
    } else if (c.rank) {
      ctx.font = 'bold 12px "Courier New", Courier, monospace';
      ctx.fillStyle = '#8b90a5';
      ctx.fillText(String(c.rank), cols[0].x, cy);
    } else {
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#555b73';
      ctx.fillText('—', cols[0].x, cy);
    }

    const dogLabel = `${c.icon || dogEmoji(c.dog_name)} ${c.dog_name}`;
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = c.eliminated ? '#555b73' : '#f0f2f8';
    ctx.fillText(dogLabel, cols[1].x, cy);

    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8b90a5';
    ctx.fillText(c.human_name, cols[2].x, cy);

    if (c.eliminated) {
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('ELIMINATED', cols[3].x, cy);
    } else if (c.rank !== null) {
      ctx.font = '12px "Courier New", Courier, monospace';

      ctx.fillStyle = (c.fault ?? 0) === 0 ? '#2dd4a0' : '#f0f2f8';
      ctx.fillText(String(c.fault ?? 0), cols[3].x, cy);

      ctx.fillStyle = (c.refusal ?? 0) === 0 ? '#2dd4a0' : '#f0f2f8';
      ctx.fillText(String(c.refusal ?? 0), cols[4].x, cy);

      ctx.fillStyle = (c.time_fault ?? 0) === 0 ? '#2dd4a0' : '#f0f2f8';
      ctx.fillText(String(c.time_fault ?? 0), cols[5].x, cy);

      ctx.font = 'bold 12px "Courier New", Courier, monospace';
      ctx.fillStyle = c.total_fault === 0 ? '#2dd4a0' : '#ff6b2c';
      ctx.fillText(String(c.total_fault ?? 0), cols[6].x, cy);

      ctx.font = '12px "Courier New", Courier, monospace';
      ctx.fillStyle = '#f0f2f8';
      ctx.fillText(c.time_sec ? `${c.time_sec.toFixed(2)}s` : '', cols[7].x, cy);
    } else {
      ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#555b73';
      ctx.fillText('Pending…', cols[3].x, cy);
    }
  });

  // ── Footer
  const footerY = tableY + TABLE_HDR_H + ranked.length * ROW_H;
  ctx.fillStyle = 'rgba(42,47,64,0.5)';
  ctx.fillRect(0, footerY, W, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, footerY, W, FOOTER_H);

  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#555b73';
  ctx.textAlign = 'left';
  ctx.fillText('paws-and-speed', 18, footerY + 25);

  const dateStr = new Date().toLocaleDateString();
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 18, footerY + 25);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PawsAndSpeed_${round.name.replace(/\s+/g, '_')}_${size}_Ranking.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

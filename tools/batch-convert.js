#!/usr/bin/env node
/**
 * 🖼️  Batch Image → WebP Converter + Auto Metadata Writer
 * =========================================================
 * Cách dùng:
 *   node tools/batch-convert.js <thư-mục-ảnh-đầu-vào> [thư-mục-output]
 *
 * Ví dụ:
 *   node tools/batch-convert.js ~/Desktop/du-an-cu ./output/du-an-cu
 *   node tools/batch-convert.js ~/Pictures/Portfolio2024
 *
 * Cài đặt (chỉ cần 1 lần):
 *   npm install --save-dev sharp
 */

import sharp from 'sharp';
import { promises as fs, existsSync } from 'fs';
import path from 'path';

// ─── CẤU HÌNH TÁC GIẢ ────────────────────────────────────────────────────────
// Sửa thông tin này trước khi dùng
const AUTHOR_CONFIG = {
  creator:   'Trí Xin Chào',
  author:    'Nguyễn Minh Trí',
  email:     'trixinchao@gmail.com',
  website:   'https://tringuyen.io.vn/',
  copyright: `© ${new Date().getFullYear()} Nguyễn Minh Trí — trixinchao. All rights reserved.`,
};

// ─── CẤU HÌNH CHẤT LƯỢNG ─────────────────────────────────────────────────────
const CONVERT = {
  quality:      85,     // Nén WebP ở mức 85% theo yêu cầu
  effort:       4,      // 0–6, tốc độ/kích thước cân bằng
  maxDimension: 0,      // 0 = Giữ nguyên kích thước gốc, không resize
};

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.heic', '.heif', '.avif', '.webp', '.bmp']);

// ─── ANSI COLORS ──────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

function fmt(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function pctStr(before, after) {
  const pct = ((1 - after / before) * 100).toFixed(1);
  const color = pct > 0 ? C.green : C.red;
  return `${color}${pct > 0 ? '▼' : '▲'}${Math.abs(pct)}%${C.reset}`;
}

/** Đệ quy tìm tất cả file ảnh */
async function findImages(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findImages(full)));
    } else if (SUPPORTED.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Tự động sinh alt text từ tên file + cấu trúc thư mục
 * "brand-identity/logo-final.jpg" → "Brand Identity – Logo Final | Trí Xin Chào"
 */
function autoAlt(filePath, inputRoot) {
  const rel    = path.relative(inputRoot, filePath);
  const parts  = rel.split(path.sep);
  const fname  = path.basename(parts.at(-1), path.extname(parts.at(-1)));
  const toHuman = s => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const folders = parts.slice(0, -1).map(toHuman).join(' › ');
  const file    = toHuman(fname);
  return folders ? `${folders} – ${file} | ${AUTHOR_CONFIG.creator}` : `${file} | ${AUTHOR_CONFIG.creator}`;
}

async function convertOne(inputPath, outputPath, inputRoot) {
  const stat    = await fs.stat(inputPath);
  const origSize = stat.size;
  const alt     = autoAlt(inputPath, inputRoot);

  const meta = await sharp(inputPath).metadata();
  const { width = 0, height = 0 } = meta;

  let pipeline = sharp(inputPath, { failOn: 'warning' });

  // Resize nếu cần
  if (CONVERT.maxDimension > 0 && Math.max(width, height) > CONVERT.maxDimension) {
    pipeline = pipeline.resize({
      width:  width  > height ? CONVERT.maxDimension : undefined,
      height: height >= width ? CONVERT.maxDimension : undefined,
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  // Ghi EXIF metadata
  pipeline = pipeline.withMetadata({
    exif: {
      IFD0: {
        Copyright:        AUTHOR_CONFIG.copyright,
        Artist:           AUTHOR_CONFIG.author,
        ImageDescription: alt,
        Software:         'trixinchao/batch-convert',
      },
    },
  });

  await pipeline.webp({ quality: CONVERT.quality, effort: CONVERT.effort }).toFile(outputPath);

  const newStat = await fs.stat(outputPath);
  return { origSize, newSize: newStat.size, alt, dim: `${width}×${height}` };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
${C.bold}🖼️  Batch Image → WebP Converter${C.reset}
${C.gray}Tự động chuyển đổi hàng loạt ảnh sang WebP + ghi metadata tác giả.${C.reset}

${C.cyan}Cách dùng:${C.reset}
  node tools/batch-convert.js <thư-mục-đầu-vào> [thư-mục-output]

${C.cyan}Ví dụ:${C.reset}
  node tools/batch-convert.js ~/Desktop/du-an-thuong-hieu
  node tools/batch-convert.js ~/Desktop/portfolio-2024 ./output/batch-2024

${C.cyan}Tính năng:${C.reset}
  ✅  Convert JPG/PNG/HEIC/TIFF/AVIF... → WebP chất lượng ${CONVERT.quality}%
  ✅  Tự động ghi EXIF: Artist, Copyright, ImageDescription
  ✅  Auto-gen alt text từ tên file + thư mục (hỗ trợ SEO)
  ✅  Giữ nguyên cấu trúc thư mục gốc
  ✅  Resize ảnh cực lớn (>${CONVERT.maxDimension}px) để tiết kiệm Cloudinary credit
  ✅  Xuất report JSON kèm alt text cho từng ảnh
`);
    process.exit(0);
  }

  const inputDir  = path.resolve(args[0].replace(/^~/, process.env.HOME));
  const outputDir = args[1]
    ? path.resolve(args[1])
    : path.resolve('./output', path.basename(inputDir));

  if (!existsSync(inputDir)) {
    console.error(`${C.red}❌  Không tìm thấy thư mục: ${inputDir}${C.reset}`);
    process.exit(1);
  }

  console.log(`\n${C.bold}🖼️  Batch Convert — Đang quét ảnh...${C.reset}`);
  console.log(`${C.gray}   Input : ${inputDir}${C.reset}`);
  console.log(`${C.gray}   Output: ${outputDir}${C.reset}\n`);

  const images = await findImages(inputDir);
  if (images.length === 0) {
    console.log(`${C.yellow}⚠️  Không tìm thấy ảnh nào trong thư mục này.${C.reset}`);
    process.exit(0);
  }

  console.log(`${C.cyan}📁  Tìm thấy ${C.bold}${images.length}${C.reset}${C.cyan} ảnh. Bắt đầu convert (quality=${CONVERT.quality}%)...${C.reset}\n`);

  let totalOrig = 0, totalNew = 0, ok = 0, fail = 0;
  const report  = [];
  const errors  = [];
  const pad     = String(images.length).length;

  for (let i = 0; i < images.length; i++) {
    const imgPath   = images[i];
    const rel       = path.relative(inputDir, imgPath);
    const outRel    = rel.replace(/\.[^.]+$/, '.webp');
    const outPath   = path.join(outputDir, outRel);

    await fs.mkdir(path.dirname(outPath), { recursive: true });

    const num = `[${String(i + 1).padStart(pad)}/${images.length}]`;
    const label = rel.length > 55 ? '…' + rel.slice(-54) : rel;
    process.stdout.write(`${C.gray}${num}${C.reset} ${label.padEnd(56)}`);

    try {
      const r = await convertOne(imgPath, outPath, inputDir);
      totalOrig += r.origSize;
      totalNew  += r.newSize;
      ok++;
      process.stdout.write(
        `${C.dim}${r.dim}${C.reset}  ` +
        `${fmt(r.origSize)} → ${C.green}${fmt(r.newSize)}${C.reset} ${pctStr(r.origSize, r.newSize)}\n`
      );
      report.push({ file: outRel, alt: r.alt, origSize: r.origSize, newSize: r.newSize, dim: r.dim });
    } catch (err) {
      process.stdout.write(`${C.red}FAIL: ${err.message}${C.reset}\n`);
      fail++;
      errors.push({ file: rel, error: err.message });
    }
  }

  // ─── KẾT QUẢ ──────────────────────────────────────────────────────────────
  const saved = totalOrig - totalNew;
  const pct   = totalOrig > 0 ? ((saved / totalOrig) * 100).toFixed(1) : 0;

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`${C.bold}✅  Hoàn tất!${C.reset}`);
  console.log(`   Thành công : ${C.green}${C.bold}${ok} ảnh${C.reset}`);
  if (fail > 0) {
    console.log(`   Thất bại   : ${C.red}${fail} ảnh${C.reset}`);
    errors.forEach(e => console.log(`   ${C.red}✗ ${e.file}${C.reset}: ${e.error}`));
  }
  console.log(`   Dung lượng : ${fmt(totalOrig)} → ${C.bold}${C.green}${fmt(totalNew)}${C.reset}`);
  console.log(`   Tiết kiệm  : ${C.bold}${C.green}${fmt(saved)} (-${pct}%)${C.reset} ← đây là credit Cloudinary bạn tiết kiệm được`);
  console.log(`   Output     : ${C.cyan}${outputDir}${C.reset}`);
  console.log(`${'─'.repeat(70)}\n`);

  // Xuất report JSON (chứa alt text để copy/paste khi upload)
  const reportPath = path.join(outputDir, '_convert-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    generatedAt:       new Date().toISOString(),
    totalImages:       ok,
    totalOriginalBytes: totalOrig,
    totalNewBytes:     totalNew,
    savedPercent:      pct,
    quality:           CONVERT.quality,
    author:            AUTHOR_CONFIG,
    images:            report,
  }, null, 2), 'utf-8');

  console.log(`${C.dim}📄  Report (alt text, kích thước): ${reportPath}${C.reset}\n`);
}

main().catch(err => {
  console.error(`\n${C.red}❌  Lỗi: ${err.message}${C.reset}`);
  process.exit(1);
});

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'article-images';
const W = 1600;
const H = 900;

mkdirSync(OUT_DIR, { recursive: true });

const palette = {
  ink: '#171717',
  muted: '#6f737a',
  hairline: '#d8dde5',
  panel: '#f6f7f9',
  paper: '#fbfbfd',
  blue: '#2f6df6',
  cyan: '#00a6a6',
  green: '#2fa66a',
  amber: '#c77c11',
  red: '#d85c5c',
  purple: '#7a5cff',
};

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrapText(text, maxChars) {
  const chunks = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    const visualLength = [...next].reduce((sum, c) => sum + (/[\x00-\xff]/.test(c) ? 0.55 : 1), 0);
    if (visualLength > maxChars && current) {
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function text({ x, y, content, size = 36, weight = 500, color = palette.ink, anchor = 'start', opacity = 1, maxChars, lineHeight }) {
  const lines = maxChars ? wrapText(content, maxChars) : [content];
  const dy = lineHeight ?? Math.round(size * 1.34);
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}" opacity="${opacity}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${esc(line)}</tspan>`)
    .join('')}</text>`;
}

function roundedRect({ x, y, width, height, radius = 28, fill = '#fff', stroke = palette.hairline, strokeWidth = 2, opacity = 1 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
}

function pill({ x, y, width, height, fill, label, color = '#fff', size = 26 }) {
  return `${roundedRect({ x, y, width, height, radius: height / 2, fill, stroke: fill, strokeWidth: 1 })}
${text({ x: x + width / 2, y: y + height / 2 + size * 0.35, content: label, size, weight: 700, color, anchor: 'middle' })}`;
}

function arrow({ x1, y1, x2, y2, color = '#9aa3b1', width = 4 }) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#arrow)"/>`;
}

function dot({ x, y, r = 10, fill = palette.blue }) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
}

function shell({ title, subtitle, eyebrow = 'Coding Agent 实践', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fbfbfd"/>
      <stop offset="1" stop-color="#eef3f7"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#14213d" flood-opacity="0.12"/>
    </filter>
    <marker id="arrow" markerWidth="16" markerHeight="16" refX="12" refY="8" orient="auto">
      <path d="M 3 3 L 13 8 L 3 13 z" fill="#9aa3b1"/>
    </marker>
    <style>
      text { font-family: "Hiragino Sans GB", "STHeiti", "PingFang SC", "Helvetica Neue", Arial, sans-serif; letter-spacing: 0; }
    </style>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <circle cx="1320" cy="140" r="180" fill="#dcecff" opacity="0.45"/>
  <circle cx="220" cy="780" r="210" fill="#e9f6ef" opacity="0.55"/>
  ${text({ x: 90, y: 84, content: eyebrow, size: 24, weight: 700, color: palette.blue })}
  ${text({ x: 90, y: 142, content: title, size: 54, weight: 800, color: palette.ink })}
  ${subtitle ? text({ x: 92, y: 190, content: subtitle, size: 26, weight: 500, color: palette.muted }) : ''}
  ${body}
</svg>`;
}

function save(name, svg) {
  const svgPath = join(OUT_DIR, `${name}.svg`);
  const pngPath = join(OUT_DIR, `${name}.png`);
  writeFileSync(svgPath, svg);
  execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), '-o', pngPath, svgPath]);
  return pngPath;
}

function card({ x, y, width, height, title, subtitle, accent = palette.blue, index }) {
  return `${roundedRect({ x, y, width, height, radius: 26, fill: '#ffffff', stroke: '#e2e6ee', strokeWidth: 2 })}
${index ? pill({ x: x + 24, y: y + 24, width: 68, height: 42, fill: accent, label: index, size: 22 }) : dot({ x: x + 42, y: y + 44, r: 13, fill: accent })}
${text({ x: x + 36, y: y + 100, content: title, size: 34, weight: 800, color: palette.ink, maxChars: 12 })}
${text({ x: x + 36, y: y + 154, content: subtitle, size: 23, weight: 500, color: palette.muted, maxChars: 20 })}`;
}

function repoRow({ x, y, width, title, subtitle, accent }) {
  return `${roundedRect({ x, y, width, height: 126, radius: 26, fill: '#ffffff', stroke: '#e2e6ee', strokeWidth: 2 })}
${dot({ x: x + 42, y: y + 44, r: 13, fill: accent })}
${text({ x: x + 74, y: y + 62, content: title, size: 34, weight: 800, color: palette.ink, maxChars: 12 })}
${text({ x: x + 74, y: y + 102, content: subtitle, size: 23, weight: 500, color: palette.muted })}`;
}

function reviewRow({ x, y, width, title, subtitle, accent }) {
  return `${roundedRect({ x, y, width, height: 124, radius: 26, fill: '#ffffff', stroke: '#e2e6ee', strokeWidth: 2 })}
${dot({ x: x + 42, y: y + 42, r: 13, fill: accent })}
${text({ x: x + 74, y: y + 58, content: title, size: 34, weight: 800, color: palette.ink, maxChars: 12 })}
${text({ x: x + 74, y: y + 96, content: subtitle, size: 22, weight: 500, color: palette.muted })}`;
}

const assets = [];

assets.push(save(
  '01-cover-efficiency',
  shell({
    eyebrow: '会用顶级 AI 的人',
    title: '效率能高到什么程度？',
    subtitle: '不是多写几行代码，而是像一个小型组织一样工作',
    body: `
      <g filter="url(#shadow)">
        ${roundedRect({ x: 92, y: 285, width: 610, height: 395, radius: 36, fill: '#ffffff', stroke: '#e4e8ef' })}
        ${text({ x: 136, y: 354, content: '过去', size: 28, weight: 800, color: palette.muted })}
        ${text({ x: 136, y: 420, content: '理解需求 → 写代码 → 自测 → 修问题 → 提交', size: 34, weight: 700, color: palette.ink, maxChars: 16 })}
        ${text({ x: 136, y: 584, content: '一个人顺序推进，效率被自己的手速和注意力限制。', size: 25, weight: 500, color: palette.muted, maxChars: 25 })}
      </g>
      <g filter="url(#shadow)">
        ${roundedRect({ x: 820, y: 245, width: 680, height: 475, radius: 36, fill: '#ffffff', stroke: '#dfe7f6' })}
        ${text({ x: 864, y: 314, content: '现在', size: 28, weight: 800, color: palette.blue })}
        ${card({ x: 864, y: 365, width: 180, height: 190, title: '拆任务', subtitle: '人定义边界', accent: palette.blue })}
        ${card({ x: 1072, y: 365, width: 180, height: 190, title: '并行做', subtitle: 'Agent 执行', accent: palette.cyan })}
        ${card({ x: 1280, y: 365, width: 180, height: 190, title: '回收质量', subtitle: '人做判断', accent: palette.green })}
        ${text({ x: 864, y: 640, content: '人负责判断和验收，AI 扩大执行半径。', size: 30, weight: 700, color: palette.ink })}
      </g>
    `,
  }),
));

assets.push(save(
  '02-agent-control-quadrant',
  shell({
    title: 'Agent 掌控策略 2x2',
    subtitle: '先判断任务类型，再选择协作方式',
    body: `
      <g transform="translate(165 250)">
        <line x1="0" y1="480" x2="1120" y2="480" stroke="#b8c0cc" stroke-width="4" marker-end="url(#arrow)"/>
        <line x1="0" y1="480" x2="0" y2="0" stroke="#b8c0cc" stroke-width="4" marker-end="url(#arrow)"/>
        <line x1="560" y1="0" x2="560" y2="480" stroke="#d8dde5" stroke-width="3" stroke-dasharray="10 12"/>
        <line x1="0" y1="240" x2="1120" y2="240" stroke="#d8dde5" stroke-width="3" stroke-dasharray="10 12"/>
        ${text({ x: 1120, y: 530, content: '执行复杂度', size: 28, weight: 800, color: palette.muted, anchor: 'end' })}
        ${text({ x: -40, y: -18, content: '重要程度', size: 28, weight: 800, color: palette.muted })}
        ${roundedRect({ x: 18, y: 18, width: 510, height: 200, radius: 28, fill: '#f1f8ff', stroke: '#d9e9ff' })}
        ${roundedRect({ x: 592, y: 18, width: 510, height: 200, radius: 28, fill: '#f2f8f5', stroke: '#d8efe3' })}
        ${roundedRect({ x: 18, y: 262, width: 510, height: 190, radius: 28, fill: '#f8f8fa', stroke: '#e5e7ec' })}
        ${roundedRect({ x: 592, y: 262, width: 510, height: 190, radius: 28, fill: '#fff7ec', stroke: '#f2dfbf' })}
        ${text({ x: 54, y: 78, content: 'Quick Win', size: 38, weight: 800, color: palette.blue })}
        ${text({ x: 54, y: 150, content: '规格清楚，快速执行，结果验收', size: 25, weight: 500, color: palette.muted })}
        ${text({ x: 630, y: 78, content: '重点项目', size: 38, weight: 800, color: palette.green })}
        ${text({ x: 630, y: 150, content: '拆小任务，多 Agent 并行，持续验收', size: 25, weight: 500, color: palette.muted })}
        ${text({ x: 54, y: 322, content: '低优先填充', size: 36, weight: 800, color: palette.muted })}
        ${text({ x: 54, y: 392, content: '自动化、顺手处理、批量清理', size: 25, weight: 500, color: palette.muted })}
        ${text({ x: 630, y: 322, content: '先拆解', size: 36, weight: 800, color: palette.amber })}
        ${text({ x: 630, y: 392, content: '降低复杂度，或判断是否值得做', size: 25, weight: 500, color: palette.muted })}
        ${pill({ x: 810, y: 58, width: 214, height: 50, fill: palette.green, label: '公司级多 repo', size: 23 })}
        ${pill({ x: 810, y: 330, width: 202, height: 48, fill: palette.amber, label: '开源兴趣项目', size: 22 })}
        ${pill({ x: 265, y: 330, width: 190, height: 48, fill: '#8f98a7', label: '小 Demo', size: 22 })}
      </g>
    `,
  }),
));

assets.push(save(
  '03-task-routing',
  shell({
    title: '一拿到任务，先路由',
    subtitle: '不要让所有任务都走同一套 AI 协作方式',
    body: `
      ${roundedRect({ x: 120, y: 285, width: 270, height: 120, radius: 30, fill: '#ffffff', stroke: '#dfe5ee' })}
      ${text({ x: 255, y: 357, content: 'Coding 任务', size: 34, weight: 800, color: palette.ink, anchor: 'middle' })}
      ${arrow({ x1: 390, y1: 345, x2: 540, y2: 345 })}
      ${roundedRect({ x: 540, y: 255, width: 260, height: 180, radius: 30, fill: '#f7fbff', stroke: '#d6e8ff' })}
      ${text({ x: 670, y: 330, content: '重要吗？', size: 34, weight: 800, color: palette.blue, anchor: 'middle' })}
      ${arrow({ x1: 800, y1: 300, x2: 1000, y2: 220 })}
      ${arrow({ x1: 800, y1: 390, x2: 1000, y2: 500 })}
      ${roundedRect({ x: 1000, y: 142, width: 390, height: 150, radius: 28, fill: '#f0f7ff', stroke: '#dbeafe' })}
      ${text({ x: 1034, y: 205, content: '重要', size: 30, weight: 800, color: palette.blue })}
      ${text({ x: 1034, y: 250, content: '继续判断复杂度', size: 24, weight: 500, color: palette.muted })}
      ${roundedRect({ x: 1000, y: 440, width: 390, height: 150, radius: 28, fill: '#fff8ec', stroke: '#f0dfbf' })}
      ${text({ x: 1034, y: 503, content: '不重要', size: 30, weight: 800, color: palette.amber })}
      ${text({ x: 1034, y: 548, content: '控制投入时间', size: 24, weight: 500, color: palette.muted })}
      ${text({ x: 174, y: 692, content: '路由结果', size: 28, weight: 800, color: palette.muted })}
      ${pill({ x: 330, y: 650, width: 210, height: 56, fill: palette.green, label: '重点项目' })}
      ${pill({ x: 570, y: 650, width: 210, height: 56, fill: palette.blue, label: 'Quick Win' })}
      ${pill({ x: 810, y: 650, width: 210, height: 56, fill: palette.amber, label: '先拆解' })}
      ${pill({ x: 1050, y: 650, width: 250, height: 56, fill: '#8f98a7', label: '低成本实验' })}
    `,
  }),
));

assets.push(save(
  '04-naive-vs-controlled',
  shell({
    title: '普通用法 vs 掌控式用法',
    subtitle: '差距不在 Prompt，而在任务边界和验收闭环',
    body: `
      <g filter="url(#shadow)">
      ${roundedRect({ x: 105, y: 250, width: 625, height: 470, radius: 36, fill: '#ffffff', stroke: '#e5e7ee' })}
      ${text({ x: 150, y: 320, content: '普通用法', size: 36, weight: 800, color: palette.muted })}
      ${text({ x: 150, y: 382, content: '需求 → 丢给 AI → 看结果 → 反复返工', size: 32, weight: 700, color: palette.ink, maxChars: 15 })}
      ${text({ x: 150, y: 550, content: '适合小任务；一旦进入跨仓库、长期维护、业务风险，容易失控。', size: 25, weight: 500, color: palette.muted, maxChars: 22 })}
      </g>
      <g filter="url(#shadow)">
      ${roundedRect({ x: 870, y: 250, width: 625, height: 470, radius: 36, fill: '#ffffff', stroke: '#dbeafe' })}
      ${text({ x: 915, y: 320, content: '掌控式用法', size: 36, weight: 800, color: palette.blue })}
      ${text({ x: 915, y: 382, content: '定义边界 → 选择模式 → 局部执行 → Review → 验收', size: 32, weight: 700, color: palette.ink, maxChars: 15 })}
      ${text({ x: 915, y: 582, content: '人从实现者，变成任务切分者、边界定义者、风险判断者。', size: 25, weight: 500, color: palette.muted, maxChars: 22 })}
      </g>
    `,
  }),
));

assets.push(save(
  '05-company-multirepo',
  shell({
    title: '公司级项目：多 repo 并行',
    subtitle: '效率来自并行，掌控来自拆分',
    body: `
      ${roundedRect({ x: 110, y: 330, width: 275, height: 130, radius: 30, fill: '#ffffff', stroke: '#dce3ee' })}
      ${text({ x: 248, y: 405, content: '一个业务需求', size: 31, weight: 800, anchor: 'middle' })}
      ${arrow({ x1: 385, y1: 395, x2: 540, y2: 395 })}
      ${roundedRect({ x: 540, y: 300, width: 300, height: 190, radius: 32, fill: '#f7fbff', stroke: '#d4e8ff' })}
      ${text({ x: 690, y: 370, content: '人拆任务', size: 34, weight: 800, color: palette.blue, anchor: 'middle' })}
      ${text({ x: 690, y: 422, content: '小到可执行、可验收', size: 24, weight: 500, color: palette.muted, anchor: 'middle' })}
      ${arrow({ x1: 840, y1: 350, x2: 1005, y2: 238 })}
      ${arrow({ x1: 840, y1: 390, x2: 1005, y2: 365 })}
      ${arrow({ x1: 840, y1: 430, x2: 1005, y2: 498 })}
      ${arrow({ x1: 840, y1: 470, x2: 1005, y2: 625 })}
      ${repoRow({ x: 1005, y: 160, width: 360, title: '知识库仓库', subtitle: 'Agent 1', accent: palette.blue })}
      ${repoRow({ x: 1005, y: 290, width: 360, title: 'AgentKit', subtitle: 'Agent 2', accent: palette.cyan })}
      ${repoRow({ x: 1005, y: 420, width: 360, title: '富文本输入框', subtitle: 'Agent 3', accent: palette.green })}
      ${repoRow({ x: 1005, y: 550, width: 360, title: '笔记编辑器', subtitle: 'Agent 4', accent: palette.purple })}
      ${text({ x: 175, y: 650, content: '统一验收：代码检查 + 页面检查 + 业务路径确认', size: 32, weight: 800, color: palette.ink })}
    `,
  }),
));

assets.push(save(
  '06-task-granularity',
  shell({
    title: '任务要拆到多小？',
    subtitle: '如果人都不知道边界，就不要假装 Agent 会知道',
    body: `
      ${card({ x: 130, y: 260, width: 315, height: 220, title: '模块归属', subtitle: '这段需求属于哪里？', accent: palette.blue, index: '1' })}
      ${arrow({ x1: 445, y1: 370, x2: 555, y2: 370 })}
      ${card({ x: 555, y: 260, width: 315, height: 220, title: '文件范围', subtitle: '大概要改哪些文件？', accent: palette.cyan, index: '2' })}
      ${arrow({ x1: 870, y1: 370, x2: 980, y2: 370 })}
      ${card({ x: 980, y: 260, width: 315, height: 220, title: '验收方式', subtitle: '怎样证明它做对了？', accent: palette.green, index: '3' })}
      ${roundedRect({ x: 215, y: 575, width: 1170, height: 120, radius: 34, fill: '#ffffff', stroke: '#dfe5ee' })}
      ${text({ x: 800, y: 650, content: '三件事都清楚，再交给 Agent 执行', size: 38, weight: 800, color: palette.ink, anchor: 'middle' })}
    `,
  }),
));

assets.push(save(
  '07-open-source-quality-loop',
  shell({
    title: '开源兴趣项目：用机制回收质量',
    subtitle: '不逐行盯代码，而是让 Review 和验证把风险点收回来',
    body: `
      ${roundedRect({ x: 100, y: 390, width: 260, height: 120, radius: 30, fill: '#ffffff', stroke: '#e0e6ef' })}
      ${text({ x: 230, y: 465, content: 'Agent 实现', size: 32, weight: 800, anchor: 'middle' })}
      ${arrow({ x1: 360, y1: 450, x2: 520, y2: 300 })}
      ${arrow({ x1: 360, y1: 450, x2: 520, y2: 450 })}
      ${arrow({ x1: 360, y1: 450, x2: 520, y2: 600 })}
      ${reviewRow({ x: 520, y: 228, width: 340, title: 'Code Review', subtitle: 'bug / 边界问题', accent: palette.blue })}
      ${reviewRow({ x: 520, y: 378, width: 340, title: '架构 Review', subtitle: '模块耦合 / 演进风险', accent: palette.purple })}
      ${reviewRow({ x: 520, y: 528, width: 340, title: 'BDD 验证', subtitle: '真实行为是否成立', accent: palette.green })}
      ${arrow({ x1: 860, y1: 298, x2: 1040, y2: 450 })}
      ${arrow({ x1: 860, y1: 450, x2: 1040, y2: 450 })}
      ${arrow({ x1: 860, y1: 598, x2: 1040, y2: 450 })}
      ${roundedRect({ x: 1040, y: 370, width: 370, height: 160, radius: 32, fill: '#fff', stroke: '#dfe5ee' })}
      ${text({ x: 1225, y: 440, content: '人二次判断', size: 34, weight: 800, anchor: 'middle' })}
      ${text({ x: 1225, y: 488, content: '只看风险点和不确定点', size: 24, weight: 500, color: palette.muted, anchor: 'middle' })}
    `,
  }),
));

assets.push(save(
  '08-bdd-front-back',
  shell({
    title: 'BDD：后端看行为，前端看路径',
    subtitle: '测试不是仪式，是证明功能真的成立',
    body: `
      <g filter="url(#shadow)">
      ${roundedRect({ x: 110, y: 250, width: 640, height: 455, radius: 36, fill: '#ffffff', stroke: '#e2e7ef' })}
      ${text({ x: 155, y: 324, content: '后端', size: 38, weight: 800, color: palette.green })}
      ${text({ x: 155, y: 402, content: 'Feature 说明', size: 30, weight: 700 })}
      ${text({ x: 155, y: 470, content: 'BDD 场景', size: 30, weight: 700 })}
      ${text({ x: 155, y: 538, content: '测试脚本', size: 30, weight: 700 })}
      ${text({ x: 155, y: 606, content: '执行验证', size: 30, weight: 700 })}
      </g>
      <g filter="url(#shadow)">
      ${roundedRect({ x: 850, y: 250, width: 640, height: 455, radius: 36, fill: '#ffffff', stroke: '#e2e7ef' })}
      ${text({ x: 895, y: 324, content: '前端', size: 38, weight: 800, color: palette.blue })}
      ${text({ x: 895, y: 402, content: '启动页面', size: 30, weight: 700 })}
      ${text({ x: 895, y: 470, content: '自动操作关键路径', size: 30, weight: 700 })}
      ${text({ x: 895, y: 538, content: '截图 / 录屏', size: 30, weight: 700 })}
      ${text({ x: 895, y: 606, content: '检查布局和交互', size: 30, weight: 700 })}
      </g>
    `,
  }),
));

assets.push(save(
  '08b-bdd-feature-files',
  shell({
    title: 'BDD .feature：写行为契约',
    subtitle: '好的 feature 文件不测实现细节，只锁住用户路径和系统边界',
    body: `
      <g filter="url(#shadow)">
      ${roundedRect({ x: 105, y: 245, width: 620, height: 500, radius: 36, fill: '#ffffff', stroke: '#e2e7ef' })}
      ${text({ x: 150, y: 315, content: '通用写法', size: 34, weight: 800, color: palette.blue })}
      ${text({ x: 150, y: 385, content: '功能: 某个产品能力的行为契约', size: 26, weight: 700, color: palette.ink })}
      ${text({ x: 150, y: 445, content: '场景: 用户完成关键动作后状态正确', size: 26, weight: 700, color: palette.ink })}
      ${text({ x: 150, y: 515, content: '假如 初始状态存在', size: 25, weight: 500, color: palette.muted })}
      ${text({ x: 150, y: 570, content: '当 用户执行一个动作', size: 25, weight: 500, color: palette.muted })}
      ${text({ x: 150, y: 625, content: '那么 可观察结果成立', size: 25, weight: 500, color: palette.muted })}
      ${text({ x: 150, y: 680, content: '而且 不破坏关键边界', size: 25, weight: 500, color: palette.muted })}
      </g>
      <g filter="url(#shadow)">
      ${roundedRect({ x: 840, y: 245, width: 655, height: 500, radius: 36, fill: '#ffffff', stroke: '#e2e7ef' })}
      ${text({ x: 885, y: 315, content: 'Openwork 里的通用类型', size: 34, weight: 800, color: palette.green })}
      ${pill({ x: 885, y: 365, width: 220, height: 52, fill: palette.blue, label: '启动 / 路由', size: 23 })}
      ${pill({ x: 1130, y: 365, width: 245, height: 52, fill: palette.cyan, label: 'Agent 长任务', size: 23 })}
      ${pill({ x: 885, y: 455, width: 275, height: 52, fill: palette.green, label: 'Workspace 持久化', size: 23 })}
      ${pill({ x: 1185, y: 455, width: 230, height: 52, fill: palette.amber, label: '审批边界', size: 23 })}
      ${pill({ x: 885, y: 545, width: 250, height: 52, fill: palette.purple, label: '外部链接安全', size: 23 })}
      ${pill({ x: 1160, y: 545, width: 230, height: 52, fill: '#8f98a7', label: '模型状态', size: 23 })}
      ${text({ x: 885, y: 665, content: '每个场景都要小而稳：入口、动作、结果、边界。', size: 27, weight: 700, color: palette.ink, maxChars: 24 })}
      </g>
    `,
  }),
));

assets.push(save(
  '09-demo-fast-loop',
  shell({
    title: '小产品 / 小 Demo：快速循环',
    subtitle: '低重要、低复杂时，目标是把想法尽快变成可体验结果',
    body: `
      ${card({ x: 110, y: 280, width: 300, height: 220, title: '想到一个点子', subtitle: '不需要先写长文档', accent: palette.blue, index: '1' })}
      ${arrow({ x1: 410, y1: 390, x2: 515, y2: 390 })}
      ${card({ x: 515, y: 280, width: 300, height: 220, title: '直接说给 AI', subtitle: '需求边聊边形成', accent: palette.cyan, index: '2' })}
      ${arrow({ x1: 815, y1: 390, x2: 920, y2: 390 })}
      ${card({ x: 920, y: 280, width: 300, height: 220, title: '生成页面', subtitle: '先有可体验结果', accent: palette.green, index: '3' })}
      ${arrow({ x1: 1220, y1: 390, x2: 1325, y2: 390 })}
      ${card({ x: 1325, y: 280, width: 190, height: 220, title: '体验', subtitle: '再决定', accent: palette.amber, index: '4' })}
      ${roundedRect({ x: 330, y: 610, width: 940, height: 86, radius: 43, fill: '#ffffff', stroke: '#dde4ee' })}
      ${text({ x: 800, y: 664, content: '不是追求完美，而是快速判断：这个想法值不值得继续做', size: 30, weight: 800, anchor: 'middle' })}
    `,
  }),
));

assets.push(save(
  '10-three-practice-models',
  shell({
    title: '三套实践，对应三种掌控模型',
    subtitle: '同样是 AI 编程，控制策略完全不同',
    body: `
      ${card({ x: 100, y: 255, width: 410, height: 360, title: '公司级重点项目', subtitle: '拆小任务 / 多 repo 并行 / 持续验收', accent: palette.green, index: 'A' })}
      ${card({ x: 595, y: 255, width: 410, height: 360, title: '开源兴趣项目', subtitle: '竞品调研 / 架构 Review / Code Review / BDD', accent: palette.blue, index: 'B' })}
      ${card({ x: 1090, y: 255, width: 410, height: 360, title: '小产品 Demo', subtitle: 'SpaceKit / vibe coding / 快速体验', accent: palette.amber, index: 'C' })}
      ${text({ x: 800, y: 735, content: '先选模式，再让 Agent 工作', size: 42, weight: 800, color: palette.ink, anchor: 'middle' })}
    `,
  }),
));

assets.push(save(
  '11-linear-to-parallel',
  shell({
    title: '从线性工作，到并行组织',
    subtitle: '效率变化来自工作方式被重构',
    body: `
      ${text({ x: 130, y: 310, content: '过去', size: 32, weight: 800, color: palette.muted })}
      ${pill({ x: 130, y: 350, width: 180, height: 56, fill: '#8f98a7', label: '理解需求' })}
      ${arrow({ x1: 310, y1: 378, x2: 380, y2: 378 })}
      ${pill({ x: 390, y: 350, width: 160, height: 56, fill: '#8f98a7', label: '写代码' })}
      ${arrow({ x1: 550, y1: 378, x2: 620, y2: 378 })}
      ${pill({ x: 630, y: 350, width: 140, height: 56, fill: '#8f98a7', label: '自测' })}
      ${arrow({ x1: 770, y1: 378, x2: 840, y2: 378 })}
      ${pill({ x: 850, y: 350, width: 160, height: 56, fill: '#8f98a7', label: '修问题' })}
      ${arrow({ x1: 1010, y1: 378, x2: 1080, y2: 378 })}
      ${pill({ x: 1090, y: 350, width: 140, height: 56, fill: '#8f98a7', label: '提交' })}
      ${text({ x: 130, y: 540, content: '现在', size: 32, weight: 800, color: palette.blue })}
      ${roundedRect({ x: 130, y: 580, width: 300, height: 90, radius: 28, fill: '#fff', stroke: '#dfe5ee' })}
      ${text({ x: 280, y: 636, content: '人理解需求和风险', size: 27, weight: 800, anchor: 'middle' })}
      ${arrow({ x1: 430, y1: 625, x2: 545, y2: 625 })}
      ${pill({ x: 560, y: 520, width: 180, height: 56, fill: palette.blue, label: 'Agent A' })}
      ${pill({ x: 560, y: 600, width: 180, height: 56, fill: palette.cyan, label: 'Agent B' })}
      ${pill({ x: 560, y: 680, width: 180, height: 56, fill: palette.green, label: 'Agent C' })}
      ${arrow({ x1: 740, y1: 548, x2: 890, y2: 625 })}
      ${arrow({ x1: 740, y1: 628, x2: 890, y2: 625 })}
      ${arrow({ x1: 740, y1: 708, x2: 890, y2: 625 })}
      ${roundedRect({ x: 900, y: 580, width: 240, height: 90, radius: 28, fill: '#fff', stroke: '#dfe5ee' })}
      ${text({ x: 1020, y: 636, content: '统一 Review', size: 29, weight: 800, anchor: 'middle' })}
      ${arrow({ x1: 1140, y1: 625, x2: 1255, y2: 625 })}
      ${roundedRect({ x: 1265, y: 580, width: 230, height: 90, radius: 28, fill: '#fff', stroke: '#dfe5ee' })}
      ${text({ x: 1380, y: 636, content: '最终判断', size: 29, weight: 800, anchor: 'middle' })}
    `,
  }),
));

assets.push(save(
  '12-human-capability-boundary',
  shell({
    title: 'AI 的边界，决定人的新能力',
    subtitle: '真正拉开差距的，是边界之外的判断力',
    body: `
      ${roundedRect({ x: 560, y: 300, width: 480, height: 190, radius: 44, fill: '#ffffff', stroke: '#dce4ef' })}
      ${text({ x: 800, y: 378, content: '会用顶级 AI 的人', size: 38, weight: 800, anchor: 'middle' })}
      ${text({ x: 800, y: 432, content: '像一个小型组织一样工作', size: 26, weight: 500, color: palette.muted, anchor: 'middle' })}
      ${card({ x: 100, y: 230, width: 340, height: 170, title: '定义边界', subtitle: '职责 / 输入输出 / 状态归属', accent: palette.blue })}
      ${card({ x: 1160, y: 230, width: 340, height: 170, title: '拆分任务', subtitle: '小到可执行、可验收', accent: palette.cyan })}
      ${card({ x: 100, y: 565, width: 340, height: 170, title: '回收质量', subtitle: 'Review / BDD / 页面验收', accent: palette.green })}
      ${card({ x: 1160, y: 565, width: 340, height: 170, title: '判断取舍', subtitle: '什么值得做，什么该放弃', accent: palette.amber })}
      ${arrow({ x1: 440, y1: 315, x2: 560, y2: 370 })}
      ${arrow({ x1: 1160, y1: 315, x2: 1040, y2: 370 })}
      ${arrow({ x1: 440, y1: 650, x2: 560, y2: 450 })}
      ${arrow({ x1: 1160, y1: 650, x2: 1040, y2: 450 })}
    `,
  }),
));

console.log(`Generated ${assets.length} PNG images in ${OUT_DIR}`);

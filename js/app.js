/* =======================================================================
   ניווט וקריאת מפה — לוגיקה אינטראקטיבית
   ======================================================================= */
'use strict';

/* ---------- 0. עזרי מתמטיקה ---------- */
const TAU = Math.PI * 2;
const deg = r => r * 180 / Math.PI;
const rad = d => d * Math.PI / 180;
const norm360 = a => ((a % 360) + 360) % 360;
// אזימוט: זווית עם כיוון השעון מהצפון. dx=מזרח, dy=צפון.
function azimuth(dx, dy) { return norm360(deg(Math.atan2(dx, dy))); }
function fmtDist(m) { return m >= 1000 ? (m / 1000).toFixed(2) + ' ק״מ' : Math.round(m) + ' מ׳'; }

/* =======================================================================
   1. מפה אינטראקטיבית של ישראל
   ======================================================================= */
const MAP = {
  viewbox: [0, 0, 200, 540],
  path: "M 96,30 C 100.7,26.5 110.7,24.5 118.0,22.0 C 125.3,19.5 134.7,17.2 140.0,15.0 C 145.3,12.8 145.7,5.8 150.0,9.0 C 154.3,12.2 162.5,25.2 166.0,34.0 C 169.5,42.8 172.3,52.7 171.0,62.0 C 169.7,71.3 161.5,80.0 158.0,90.0 C 154.5,100.0 151.3,107.7 150.0,122.0 C 148.7,136.3 149.5,159.7 150.0,176.0 C 150.5,192.3 152.2,207.7 153.0,220.0 C 153.8,232.3 155.5,238.0 155.0,250.0 C 154.5,262.0 152.5,277.0 150.0,292.0 C 147.5,307.0 143.8,320.3 140.0,340.0 C 136.2,359.7 131.5,383.7 127.0,410.0 C 122.5,436.3 116.2,479.0 113.0,498.0 C 109.8,517.0 110.2,524.0 108.0,524.0 C 105.8,524.0 102.7,513.7 100.0,498.0 C 97.3,482.3 95.3,453.0 92.0,430.0 C 88.7,407.0 86.2,381.7 80.0,360.0 C 73.8,338.3 64.3,312.5 55.0,300.0 C 45.7,287.5 26.3,293.3 24.0,285.0 C 21.7,276.7 35.3,262.5 41.0,250.0 C 46.7,237.5 53.8,223.3 58.0,210.0 C 62.2,196.7 64.0,183.3 66.0,170.0 C 68.0,156.7 68.3,142.5 70.0,130.0 C 71.7,117.5 73.7,106.7 76.0,95.0 C 78.3,83.3 81.7,68.7 84.0,60.0 C 86.3,51.3 88.0,48.0 90.0,43.0 C 92.0,38.0 91.3,33.5 96.0,30.0 Z",
  markers: {
    golan:[162,55], galil:[137,52], carmel:[93,86], hasharon:[74,140],
    shomron:[119,150], yerushalaim:[121,205], yehuda_desert:[146,242],
    negev_north:[83,300], har_hanegev:[84,372], arava:[122,425], eilat:[108,505]
  },
  water: { kinneret:[147,108], deadsea:[149,258] }
};

const REGIONS = {
  golan: { name:'רמת הגולן', color:'#5d7a3a', label:'גולן',
    terrain:'רמה בזלתית גבוהה החתוכה בערוצים עמוקים (נחלים זורמים), עם תלים געשיים ("תילים") בולטים.',
    elev:'מ־כ־300 מ׳ בדרום ועד מעל 1,000 מ׳ בצפון; החרמון מתנשא מעליה.',
    nav:'תילים ותצפיות פתוחות מקלים על התמצאות; הערוצים העמוקים חוסמים תנועה ומחייבים מעקפים.',
    feat:'תילים עגולים (קווי גובה סגורים), ערוצים חדים, מאגרי מים.' },
  galil: { name:'הגליל', color:'#4a5d2b', label:'גליל',
    terrain:'אזור הררי (גליל עליון ותחתון) עם רכסים, עמקים חקלאיים ויערות צפופים.',
    elev:'הר מירון (~1,208 מ׳) — הגבוה בישראל שבתחום הקו הירוק.',
    nav:'צומח צפוף מגביל שדה ראייה; ריבוי רכסים ואוכפים מצריך דיוק בזיהוי צורות תבליט.',
    feat:'רכסים ואוכפים רבים, מדרונות תלולים (קווי גובה צפופים), יער בירוק.' },
  carmel: { name:'הכרמל ועמק יזרעאל', color:'#6b7d3a', label:'כרמל / עמקים',
    terrain:'רכס הכרמל המיוער היורד לים, ולמרגלותיו עמק יזרעאל השטוח והחקלאי.',
    elev:'הכרמל עד ~546 מ׳; עמק יזרעאל כמעט מישורי.',
    nav:'ניגוד חד בין רכס תלול ומיוער לבין מישור פתוח — קל לזהות את קו המגע ביניהם כציר התמצאות.',
    feat:'מדרון תלול אחיד בכרמל, שטח פתוח ומיושב בעמק, צירי דרכים ברורים.' },
  hasharon: { name:'מישור החוף והשרון', color:'#8a9a5b', label:'חוף / שרון',
    terrain:'מישור חופי שטוח ורחב לאורך הים התיכון, עתיר יישובים, פרדסים וכבישים.',
    elev:'נמוך, קרוב לגובה פני הים; כורכר וגבעות חול נמוכות.',
    nav:'מעט צורות תבליט לזיהוי — מנווטים בעיקר לפי מאפיינים מלאכותיים: כבישים, יישובים, מסילה וקו החוף.',
    feat:'רשת דרכים צפופה, גושי יישובים, קו חוף כקו ייחוס מובהק.' },
  shomron: { name:'הרי השומרון', color:'#7a5d2e', label:'שומרון',
    terrain:'גב הררי מרכזי עם רכסים, בקעות פנימיות וטרסות חקלאיות.',
    elev:'פסגות סביב 800–940 מ׳ (בעל חצור, הר עיבל).',
    nav:'רכסים מקבילים ואוכפים ביניהם; חשוב להבחין בין ערוצים היורדים מזרחה (למדבר) למערבה (לחוף).',
    feat:'קווי רכס ברורים, כפרים על ראשי גבעות, טרסות.' },
  yerushalaim: { name:'ירושלים והרי יהודה', color:'#8a6a35', label:'ירושלים / הרי יהודה',
    terrain:'רמה הררית עם עמקים חקלאיים; מדרון מערבי מתון (לשפלה) ומדרון מזרחי תלול (למדבר).',
    elev:'ירושלים ~750–800 מ׳; פסגות עד מעל 1,000 מ׳.',
    nav:'"קו פרשת המים" הארצי עובר כאן — משני צדדיו הערוצים זורמים לכיוונים מנוגדים; כלי התמצאות מרכזי.',
    feat:'קו פרשת מים בולט, ניגוד מדרונות, יישוב צפוף.' },
  yehuda_desert: { name:'מדבר יהודה וים המלח', color:'#b08a4a', label:'מדבר יהודה',
    terrain:'מדרון מדברי תלול היורד ממזרח הרי יהודה אל בקע ים המלח, חתוך בנחלי אכזב עמוקים (קניונים).',
    elev:'מ־כ־800 מ׳ עד ל־430- מ׳ (החוף הנמוך ביבשה) — הפרש עצום במרחק קצר.',
    nav:'שטח פתוח וחשוף (שדה ראייה מצוין) אך הנחלים העמוקים והמצוקים חוסמים ומסכנים; מחייב תכנון ציר זהיר.',
    feat:'קווי גובה צפופים מאוד, מצוקים, נחלי אכזב, מעטה צומח דליל.' },
  negev_north: { name:'צפון הנגב ובקעת באר שבע', color:'#c19a5b', label:'צפון הנגב',
    terrain:'מרחבי לס וגבעות מתונות, בתרונות (ערוצי סחף) ובקעות פתוחות.',
    elev:'מתון, מאות מטרים בודדים.',
    nav:'צורות תבליט רכות ומעט נקודות ייחוס — אתגר בזיהוי מדויק; הבתרונות עלולים להטעות.',
    feat:'גבעות לס מעוגלות, בתרונות, שטח פתוח.' },
  har_hanegev: { name:'הר הנגב והמכתשים', color:'#a97a3a', label:'הר הנגב',
    terrain:'הר מדברי גבוה עם שלושת המכתשים (רמון, החטירה, קטן) — צורות נוף ייחודיות.',
    elev:'עד ~1,033 מ׳ (הר רמון).',
    nav:'קירות המכתשים והמצוקים הם מחסומים וגם נקודות ייחוס מצוינות; מרחקים גדולים בין מקורות מים.',
    feat:'מכתשים (מצוקים תוחמים), רכסים חשופים, שדה ראייה רחב.' },
  arava: { name:'הערבה', color:'#c9a05f', label:'ערבה',
    terrain:'בקע מדברי שטוח וארוך בין ים המלח לאילת, למרגלות הרים משני צדדיו.',
    elev:'נמוך, יורד לכיוון ים המלח; מישורי ברובו.',
    nav:'שטח פתוח מאוד עם מעט נקודות ייחוס בתוכו — מנווטים לפי קווי ההרים משני הצדדים והנחלים החוצים.',
    feat:'מישור נרחב, מניפות סחף, רכסי מסגרת ממזרח וממערב.' },
  eilat: { name:'הרי אילת', color:'#9a6a30', label:'אילת',
    terrain:'הרי גרניט ומגמה קדומים, חדים וצבעוניים, עם ואדיות צרים.',
    elev:'עד ~890 מ׳ (הר שחורת/יהושפט) יורד לים סוף.',
    nav:'תבליט חד וקיצוני — פסגות חדות וערוצים צרים; דורש קריאת קווי גובה מדויקת ותנועה בערוצים.',
    feat:'פסגות חדות, ערוצים צרים, מסלע צבעוני, שדה ראייה משתנה.' }
};

function buildMap() {
  const svg = document.getElementById('israel-map');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  // צללית
  svg.appendChild(mk('path', { d: MAP.path, fill: '#e9e0c4', stroke: '#8a7a4e', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }));

  // מקווי מים
  const kin = MAP.water.kinneret, ds = MAP.water.deadsea;
  svg.appendChild(mk('ellipse', { cx: kin[0], cy: kin[1], rx: 6, ry: 9, class: 'water', fill: '#6fa9bb', stroke: '#4a7c8c', 'stroke-width': 0.6 }));
  svg.appendChild(mk('ellipse', { cx: ds[0], cy: ds[1], rx: 5, ry: 16, class: 'water', fill: '#6fa9bb', stroke: '#4a7c8c', 'stroke-width': 0.6 }));

  // אזורים כסמנים לחיצים
  Object.entries(MAP.markers).forEach(([key, [x, y]]) => {
    const g = mk('g', { class: 'region', 'data-key': key, tabindex: 0, role: 'button', 'aria-label': REGIONS[key].name });
    g.appendChild(mk('circle', { cx: x, cy: y, r: 13, fill: REGIONS[key].color, 'fill-opacity': 0.85 }));
    g.appendChild(mk('circle', { cx: x, cy: y, r: 2.4, fill: '#fff' }));
    const label = mk('text', { x: x, y: y + 22, class: 'rlabel' });
    label.textContent = REGIONS[key].label;
    g.appendChild(label);
    g.addEventListener('click', () => selectRegion(key, g));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRegion(key, g); } });
    svg.appendChild(g);
  });
}

function selectRegion(key, g) {
  document.querySelectorAll('#israel-map .region').forEach(el => el.classList.remove('active'));
  g.classList.add('active');
  const r = REGIONS[key];
  document.getElementById('regionInfo').innerHTML = `
    <h3>${r.name}</h3>
    <div class="badge-row"><span class="pill" style="background:${r.color}">אזור</span></div>
    <dl>
      <dt>אופי השטח</dt><dd>${r.terrain}</dd>
      <dt>גובה בולט</dt><dd>${r.elev}</dd>
      <dt>אתגר ניווטי</dt><dd>${r.nav}</dd>
      <dt>מאפייני מפה בולטים</dt><dd>${r.feat}</dd>
    </dl>`;
}

/* =======================================================================
   2. הדמיית קווי גובה (תבליט)
   ======================================================================= */
const contour = (() => {
  const cv = document.getElementById('contourCanvas');
  if (!cv) return {};
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const INTERVAL = 10; // פרש גובה 10 מ׳
  let heights = new Float32Array(W * H);
  let hMin = Infinity, hMax = -Infinity;
  let baseImage = null;
  let activeFeat = 'all';

  const gauss = (u, v, cu, cv2, su, sv) => Math.exp(-(((u - cu) ** 2) / (2 * su * su) + ((v - cv2) ** 2) / (2 * sv * sv)));
  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy; return Math.hypot(px - qx, py - qy);
  }

  // מוקדי צורות התבליט (בקואורדינטות יחסיות 0..1)
  const FEAT = {
    peak:   { u: 0.28, v: 0.40, txt: 'פסגה — קווי גובה סגורים זה בתוך זה, יורדת לכל הכיוונים. נקודת התמצאות בולטת ומצוינת.' },
    saddle: { u: 0.49, v: 0.37, txt: 'אוכף — האזור הנמוך שבין שתי פסגות; שני כיוונים עולים ושניים יורדים. מעבר נוח בין אגני ניקוז.' },
    ridge:  { u: 0.16, v: 0.66, txt: 'שלוחה — לשון גבוהה היורדת לשלושה כיוונים; קווי הגובה יוצרים ⋀ שקודקודו במורד. ציר תנועה נוח.' },
    valley: { u: 0.57, v: 0.78, txt: 'ערוץ — תוואי ניקוז המים; קווי הגובה יוצרים ⋁ שקודקודו במעלה. "עמוד השדרה" של המפה.' },
    all:    { txt: 'זהו מרחב עם שתי פסגות, אוכף ביניהן, שלוחה יורדת מהפסגה, וערוץ ניקוז. גררו את המפלס — ראו כיצד "טבעת" קו הגובה נעה עם הגובה.' }
  };

  function heightAt(u, v) {
    let h = 12;
    h += 74 * gauss(u, v, 0.28, 0.40, 0.13, 0.13);        // פסגה P1
    h += 60 * gauss(u, v, 0.70, 0.34, 0.19, 0.11);        // פסגה P2 (מוארכת = רכס)
    h += 30 * gauss(u, v, 0.16, 0.66, 0.09, 0.15);        // שלוחה
    const dv = distToSeg(u, v, 0.50, 0.50, 0.66, 0.98);   // ערוץ
    h -= 42 * Math.exp(-(dv * dv) / (2 * 0.05 * 0.05));
    return Math.max(0, h);
  }

  function build() {
    hMin = Infinity; hMax = -Infinity;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const h = heightAt(x / W, y / H);
      heights[y * W + x] = h;
      if (h < hMin) hMin = h; if (h > hMax) hMax = h;
    }
    // תמונת בסיס: הצללת תבליט + קווי גובה
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; const h = heights[i];
      const t = (h - hMin) / (hMax - hMin);
      // מדרג ירוק→חום→בהיר לפי גובה
      let r, g, b;
      if (t < 0.5) { const k = t / 0.5; r = 120 + k * 60; g = 140 + k * 30; b = 80 + k * 20; }
      else { const k = (t - 0.5) / 0.5; r = 180 + k * 40; g = 170 - k * 30; b = 100 - k * 40; }
      // קו גובה: אם חוצים גבול רצועה מול השכן משמאל/מעל
      const band = Math.floor(h / INTERVAL);
      const bl = x > 0 ? Math.floor(heights[i - 1] / INTERVAL) : band;
      const bu = y > 0 ? Math.floor(heights[i - W] / INTERVAL) : band;
      let contourHere = (band !== bl || band !== bu);
      const isIndex = contourHere && (band % 5 === 0); // קו אב כל 50 מ׳
      const p = i * 4;
      if (contourHere) { const c = isIndex ? 70 : 110; d[p] = c; d[p + 1] = c * 0.7; d[p + 2] = c * 0.4; d[p + 3] = 255; }
      else { d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255; }
    }
    baseImage = img;
    setFlood(50);
  }

  function setFlood(pct) {
    if (!baseImage) return;
    const level = hMin + (hMax - hMin) * (pct / 100);
    document.getElementById('floodVal').textContent = Math.round(level);
    // ציור מחדש: בסיס + הצפה + הדגשת רצועת המפלס + הדגשת צורת תבליט
    ctx.putImageData(baseImage, 0, 0);
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < W * H; i++) {
      const h = heights[i]; const p = i * 4;
      if (h < level) { // מתחת למפלס — גוון מים
        d[p] = d[p] * 0.35 + 74 * 0.65; d[p + 1] = d[p + 1] * 0.35 + 140 * 0.65; d[p + 2] = d[p + 2] * 0.35 + 170 * 0.65;
      } else if (h < level + 1.2) { // קו המפלס עצמו — הדגשה
        d[p] = 212; d[p + 1] = 160; d[p + 2] = 44;
      }
    }
    ctx.putImageData(img, 0, 0);
    // הדגשת צורת תבליט
    if (activeFeat !== 'all' && FEAT[activeFeat]) {
      const f = FEAT[activeFeat];
      const cx = f.u * W, cy = f.v * H;
      ctx.save();
      ctx.strokeStyle = '#b5482f'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, 34, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#b5482f'; ctx.font = 'bold 15px Heebo, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('◉', cx, cy + 5);
      ctx.restore();
    }
    document.getElementById('featExplain').textContent = FEAT[activeFeat].txt;
  }

  const slider = document.getElementById('floodSlider');
  slider.addEventListener('input', () => setFlood(+slider.value));
  document.querySelectorAll('#contours .seg button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#contours .seg button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on'); activeFeat = btn.dataset.feat; setFlood(+slider.value);
    });
  });

  build();
  return {};
})();

/* =======================================================================
   3. מתרגל דקירת נ״צ
   ======================================================================= */
const gridTrainer = (() => {
  const cv = document.getElementById('gridCanvas');
  if (!cv) return {};
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const M = 42;                    // שוליים לתוויות
  const PLOT = W - M - 10;         // אזור השרטוט
  const N = 5;                     // 5x5 משבצות (ק״מ)
  const px = PLOT / N;             // פיקסלים לק״מ
  const baseE = 23, baseN = 67;    // קווי רשת בסיס (מוצגים כשתי ספרות)
  let mode = 'read';
  let target = null;               // {eastVal, northVal, e3, n3}
  let clicked = null;

  const toX = eVal => M + (eVal - baseE) * px;
  const toY = nVal => (M + PLOT) - (nVal - baseN) * px; // צפון למעלה
  const fromX = x => baseE + (x - M) / px;
  const fromY = y => baseN + ((M + PLOT) - y) / px;

  function randTarget() {
    const be = baseE + Math.floor(Math.random() * N);
    const bn = baseN + Math.floor(Math.random() * N);
    const te = Math.floor(Math.random() * 10), tn = Math.floor(Math.random() * 10);
    const eastVal = be + te / 10, northVal = bn + tn / 10;
    target = { eastVal, northVal, e3: `${be}${te}`, n3: `${bn}${tn}` };
    clicked = null;
    document.getElementById('plotTarget').textContent = `${target.e3} · ${target.n3}`;
    document.getElementById('gridFeedback').textContent = '';
    document.getElementById('gridFeedback').className = 'feedback';
    const re = document.getElementById('readEast'), rn = document.getElementById('readNorth');
    if (re) re.value = ''; if (rn) rn.value = '';
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f4efe1'; ctx.fillRect(0, 0, W, H);
    // רשת עשיריות (עדינה)
    ctx.strokeStyle = 'rgba(169,116,58,0.18)'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= N * 10; i++) {
      const x = M + i * px / 10, y = (M + PLOT) - i * px / 10;
      ctx.beginPath(); ctx.moveTo(x, M); ctx.lineTo(x, M + PLOT); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M + PLOT, y); ctx.stroke();
    }
    // קווי רשת ראשיים (ק״מ)
    ctx.strokeStyle = '#7d8c4e'; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#33421f'; ctx.font = 'bold 15px Heebo, sans-serif';
    for (let i = 0; i <= N; i++) {
      const x = M + i * px, y = M + i * px;
      ctx.beginPath(); ctx.moveTo(x, M); ctx.lineTo(x, M + PLOT); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M + PLOT, y); ctx.stroke();
      // תווית מזרחית (למטה)
      ctx.textAlign = 'center';
      ctx.fillText(String(baseE + i), x, M + PLOT + 20);
      // תווית צפונית (בצד ימין, RTL) — נשים משמאל
      ctx.textAlign = 'right';
      ctx.fillText(String(baseN + (N - i)), M - 8, M + i * px + 5);
    }
    // כותרות צירים
    ctx.fillStyle = '#4a5d2b'; ctx.font = '600 12px Heebo, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('מזרחית ←', M + PLOT / 2, H - 6);
    ctx.save(); ctx.translate(12, M + PLOT / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('צפונית ←', 0, 0); ctx.restore();

    // יעד
    if (target && mode === 'read') {
      const x = toX(target.eastVal), y = toY(target.northVal);
      ctx.fillStyle = '#b5482f'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (mode === 'plot' && clicked) {
      // נקודת הלחיצה
      ctx.fillStyle = '#4a7c8c'; ctx.beginPath(); ctx.arc(clicked.x, clicked.y, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      // היעד האמיתי (לאחר בדיקה)
      if (clicked.showTruth && target) {
        const tx = toX(target.eastVal), ty = toY(target.northVal);
        ctx.fillStyle = '#b5482f'; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.strokeStyle = '#b5482f'; ctx.setLineDash([4, 3]); ctx.beginPath();
        ctx.moveTo(clicked.x, clicked.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }

  function checkRead() {
    const e = document.getElementById('readEast').value.trim();
    const n = document.getElementById('readNorth').value.trim();
    const fb = document.getElementById('gridFeedback');
    if (e === target.e3 && n === target.n3) {
      fb.textContent = `✓ מדויק! הנ״צ היא ${target.e3} ${target.n3}.`; fb.className = 'feedback ok';
    } else {
      fb.textContent = `✗ לא מדויק. הנ״צ הנכונה: ${target.e3} ${target.n3}. בדקו: קודם מזרחית (ימין), אחר כך צפונית (מעלה).`;
      fb.className = 'feedback bad';
    }
  }

  cv.addEventListener('click', ev => {
    if (mode !== 'plot' || !target) return;
    const rect = cv.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (W / rect.width);
    const y = (ev.clientY - rect.top) * (H / rect.height);
    if (x < M || x > M + PLOT || y < M || y > M + PLOT) return;
    const eVal = fromX(x), nVal = fromY(y);
    const err = Math.hypot(eVal - target.eastVal, nVal - target.northVal); // בק״מ
    const fb = document.getElementById('gridFeedback');
    clicked = { x, y, showTruth: true };
    if (err <= 0.12) { fb.textContent = `✓ פגיעה! (שגיאה ${Math.round(err * 1000)} מ׳)`; fb.className = 'feedback ok'; }
    else { fb.textContent = `✗ החטאה של ${Math.round(err * 1000)} מ׳. הקו האדום מראה את היעד הנכון.`; fb.className = 'feedback bad'; }
    draw();
  });

  document.getElementById('checkRead').addEventListener('click', checkRead);
  document.getElementById('newTarget').addEventListener('click', randTarget);
  document.getElementById('modeRead').addEventListener('click', () => setMode('read'));
  document.getElementById('modePlot').addEventListener('click', () => setMode('plot'));

  function setMode(m) {
    mode = m;
    document.getElementById('modeRead').classList.toggle('on', m === 'read');
    document.getElementById('modePlot').classList.toggle('on', m === 'plot');
    document.getElementById('readMode').classList.toggle('hidden', m !== 'read');
    document.getElementById('plotMode').classList.toggle('hidden', m !== 'plot');
    randTarget();
  }

  randTarget(); draw();
  return {};
})();

/* =======================================================================
   4. מחשבון אזימוט
   ======================================================================= */
(() => {
  const $ = id => document.getElementById(id);
  const declSlider = $('decl');
  function calc() {
    const ax = +$('ax').value, ay = +$('ay').value, bx = +$('bx').value, by = +$('by').value;
    const decl = +declSlider.value;
    const dx = bx - ax, dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const gridAz = azimuth(dx, dy);
    const magAz = norm360(gridAz - decl);   // הצפון המגנטי מזרחה → מפחיתים
    const back = norm360(gridAz + 180);
    $('rDist').textContent = fmtDist(dist);
    $('rGrid').textContent = gridAz.toFixed(1) + '°';
    $('rMag').textContent = magAz.toFixed(1) + '°';
    $('rBack').textContent = back.toFixed(1) + '°';
  }
  declSlider.addEventListener('input', () => { $('decShow').textContent = (+declSlider.value).toFixed(1); calc(); });
  $('calcAz').addEventListener('click', calc);
  calc();
})();

/* =======================================================================
   5. תרשים שלושת הצפונים
   ======================================================================= */
(() => {
  const svg = document.getElementById('northDiagram');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const ox = 150, oy = 250, L = 200;
  const decl = 5, gridConv = 1.5; // מעלות (להמחשה)
  function line(angleDeg, color, w, label, lx) {
    const a = rad(angleDeg);
    const x2 = ox + L * Math.sin(a), y2 = oy - L * Math.cos(a);
    svg.appendChild(mk('line', { x1: ox, y1: oy, x2, y2, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }));
    svg.appendChild(mk('polygon', { points: `${x2},${y2 - 0} ${x2 - 5},${y2 + 10} ${x2 + 5},${y2 + 10}`, fill: color, transform: `rotate(${angleDeg} ${x2} ${y2})` }));
    const t = mk('text', { x: x2 + lx, y: y2 - 6, fill: color, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, label);
    svg.appendChild(t);
  }
  svg.appendChild(mk('circle', { cx: ox, cy: oy, r: 5, fill: '#22271c' }));
  line(-gridConv, '#4a5d2b', 4, 'רשת', -14);   // צפון רשת (מעט שמאלה)
  line(0, '#22271c', 3, 'אמיתי', 0);            // צפון אמיתי
  line(decl, '#b5482f', 4, 'מגנטי', 16);        // צפון מגנטי (מזרחה=ימינה)
  // קשת סטייה
  svg.appendChild(mk('path', { d: `M ${ox},${oy - 70} A 70 70 0 0 1 ${ox + 70 * Math.sin(rad(decl))},${oy - 70 * Math.cos(rad(decl))}`, fill: 'none', stroke: '#b5482f', 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }));
  svg.appendChild(mk('text', { x: ox + 26, y: oy - 82, fill: '#b5482f', 'font-size': 12, 'font-weight': 700 }, '≈5° מזרחה'));
  svg.appendChild(mk('text', { x: ox, y: oy + 30, fill: '#4b5140', 'font-size': 11, 'text-anchor': 'middle' }, 'נקודת התצפית'));
})();

/* =======================================================================
   6. מתכנן ציר ניווט (פעילות יצירתית)
   ======================================================================= */
(() => {
  const cv = document.getElementById('plannerCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const M = 36, PLOT_W = W - M - 10, PLOT_H = H - M - 26;
  const KM = 6;                    // 6 ק״מ לרוחב
  const px = PLOT_W / KM;
  const baseE = 231, baseN = 660;  // מוצא רשת להצגת נ״צ
  const DECL = 5;
  let wps = [];                    // {x,y,name}
  const strideEl = document.getElementById('stride');

  const eOf = x => baseE + (x - M) / px;
  const nOf = y => baseN + ((M + PLOT_H) - y) / px;
  const nz = (x, y) => {
    const e = eOf(x), n = nOf(y);
    const e3 = String(Math.round(e * 10)).slice(-3);
    const n3 = String(Math.round(n * 10)).slice(-3);
    return `${e3} ${n3}`;
  };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#eef3e2'; ctx.fillRect(0, 0, W, H);
    // רשת ק״מ
    ctx.strokeStyle = 'rgba(125,140,78,0.5)'; ctx.lineWidth = 1;
    ctx.fillStyle = '#4a5d2b'; ctx.font = '11px Heebo, sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= KM; i++) {
      const x = M + i * px; ctx.beginPath(); ctx.moveTo(x, M); ctx.lineTo(x, M + PLOT_H); ctx.stroke();
      ctx.fillText(String(baseE + i), x, M + PLOT_H + 16);
    }
    const rows = Math.round(PLOT_H / px);
    for (let j = 0; j <= rows; j++) {
      const y = M + j * px; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M + PLOT_W, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.fillText(String(baseN + (rows - j)), M - 6, y + 4); ctx.textAlign = 'center';
    }
    // צלעות
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i], b = wps[i + 1];
      ctx.strokeStyle = '#b5482f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // ראש חץ
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.fillStyle = '#b5482f'; ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - 11 * Math.cos(ang - 0.4), b.y - 11 * Math.sin(ang - 0.4));
      ctx.lineTo(b.x - 11 * Math.cos(ang + 0.4), b.y - 11 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      // תווית אזימוט על אמצע הצלע
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const az = azimuth((b.x - a.x) / px, -(b.y - a.y) / px);
      ctx.fillStyle = '#26301c'; ctx.font = 'bold 11px Heebo, sans-serif';
      ctx.fillText(Math.round(az) + '°', mx, my - 6);
    }
    // נקודות
    wps.forEach((w, i) => {
      ctx.fillStyle = '#33421f'; ctx.beginPath(); ctx.arc(w.x, w.y, 8, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Heebo, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), w.x, w.y + 4);
      if (w.name) { ctx.fillStyle = '#22271c'; ctx.font = '600 11px Heebo, sans-serif'; ctx.fillText(w.name, w.x, w.y - 12); }
    });
    updateCard();
  }

  function updateCard() {
    const tbody = document.querySelector('#navCard tbody');
    const stride = +strideEl.value / 100; // מ׳
    let total = 0;
    if (wps.length < 2) {
      tbody.innerHTML = '<tr><td colspan="7" class="small" style="text-align:center;color:var(--ink-soft)">הניחו לפחות שתי נקודות ביקורת כדי לייצר כרטיס ניווט…</td></tr>';
    } else {
      let html = '';
      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i], b = wps[i + 1];
        const de = (b.x - a.x) / px, dn = -(b.y - a.y) / px; // ק״מ
        const distKm = Math.hypot(de, dn);
        const distM = distKm * 1000; total += distM;
        const gridAz = azimuth(de, dn);
        const magAz = norm360(gridAz - DECL);
        const steps = Math.round(distM / stride);
        const from = a.name || `נק׳ ${i + 1}`, to = b.name || `נק׳ ${i + 2}`;
        html += `<tr>
          <td class="leg-num">${i + 1}</td>
          <td>${from} ← ${to}</td>
          <td>${nz(b.x, b.y)}</td>
          <td>${gridAz.toFixed(0)}°</td>
          <td>${magAz.toFixed(0)}°</td>
          <td>${fmtDist(distM)}</td>
          <td>${steps.toLocaleString('he-IL')}</td>
        </tr>`;
      }
      tbody.innerHTML = html;
    }
    document.getElementById('totWp').textContent = wps.length;
    document.getElementById('totDist').textContent = total ? fmtDist(total) : '0';
  }

  cv.addEventListener('click', ev => {
    const rect = cv.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (W / rect.width);
    const y = (ev.clientY - rect.top) * (H / rect.height);
    if (x < M || x > M + PLOT_W || y < M || y > M + PLOT_H) return;
    const nameEl = document.getElementById('wpName');
    wps.push({ x, y, name: nameEl.value.trim() });
    nameEl.value = '';
    draw();
  });

  document.getElementById('undoWp').addEventListener('click', () => { wps.pop(); draw(); });
  document.getElementById('clearWp').addEventListener('click', () => { wps = []; draw(); });
  strideEl.addEventListener('input', () => { document.getElementById('strideShow').textContent = strideEl.value; updateCard(); });

  document.getElementById('printCard').addEventListener('click', () => {
    if (wps.length < 2) { alert('הניחו לפחות שתי נקודות ביקורת לפני ההדפסה.'); return; }
    const rows = document.querySelector('#navCard tbody').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>כרטיס ניווט</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h1{color:#33421f}
      table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;text-align:center}
      th{background:#33421f;color:#fff}.meta{color:#555;font-size:14px}</style></head><body>
      <h1>כרטיס ניווט</h1>
      <p class="meta">סטייה מגנטית בשימוש: ${DECL}° · אורך צעד: ${strideEl.value} ס״מ · מספר צלעות: ${wps.length - 1}</p>
      <table><thead><tr><th>רגל</th><th>מ־ ← אל</th><th>נ״צ יעד</th><th>אזימוט רשת</th><th>אזימוט מגנטי</th><th>מרחק</th><th>אומדן צעדים</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="meta">הופק באתר "ניווט וקריאת מפה". לאימות תמיד השוו למפה המעודכנת ולנהלים.</p>
      </body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
  });

  draw();
})();

/* ---------- אתחול ---------- */
buildMap();

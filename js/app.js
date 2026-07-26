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
  carmel: { name:'הכרמל ועמק יזרעאל', color:'#6b7d3a', label:'כרמל',
    terrain:'רכס הכרמל המיוער היורד לים, ולמרגלותיו עמק יזרעאל השטוח והחקלאי.',
    elev:'הכרמל עד ~546 מ׳; עמק יזרעאל כמעט מישורי.',
    nav:'ניגוד חד בין רכס תלול ומיוער לבין מישור פתוח — קל לזהות את קו המגע ביניהם כציר התמצאות.',
    feat:'מדרון תלול אחיד בכרמל, שטח פתוח ומיושב בעמק, צירי דרכים ברורים.' },
  hasharon: { name:'מישור החוף והשרון', color:'#8a9a5b', label:'שרון',
    terrain:'מישור חופי שטוח ורחב לאורך הים התיכון, עתיר יישובים, פרדסים וכבישים.',
    elev:'נמוך, קרוב לגובה פני הים; כורכר וגבעות חול נמוכות.',
    nav:'מעט צורות תבליט לזיהוי — מנווטים בעיקר לפי מאפיינים מלאכותיים: כבישים, יישובים, מסילה וקו החוף.',
    feat:'רשת דרכים צפופה, גושי יישובים, קו חוף כקו ייחוס מובהק.' },
  shomron: { name:'הרי השומרון', color:'#7a5d2e', label:'שומרון',
    terrain:'גב הררי מרכזי עם רכסים, בקעות פנימיות וטרסות חקלאיות.',
    elev:'פסגות סביב 800–940 מ׳ (בעל חצור, הר עיבל).',
    nav:'רכסים מקבילים ואוכפים ביניהם; חשוב להבחין בין ערוצים היורדים מזרחה (למדבר) למערבה (לחוף).',
    feat:'קווי רכס ברורים, כפרים על ראשי גבעות, טרסות.' },
  yerushalaim: { name:'ירושלים והרי יהודה', color:'#8a6a35', label:'ירושלים',
    terrain:'רמה הררית עם עמקים חקלאיים; מדרון מערבי מתון (לשפלה) ומדרון מזרחי תלול (למדבר).',
    elev:'ירושלים ~750–800 מ׳; פסגות עד מעל 1,000 מ׳.',
    nav:'"קו פרשת המים" הארצי עובר כאן — משני צדדיו הערוצים זורמים לכיוונים מנוגדים; כלי התמצאות מרכזי.',
    feat:'קו פרשת מים בולט, ניגוד מדרונות, יישוב צפוף.' },
  yehuda_desert: { name:'מדבר יהודה וים המלח', color:'#b08a4a', label:'מ. יהודה',
    terrain:'מדרון מדברי תלול היורד ממזרח הרי יהודה אל בקע ים המלח, חתוך בנחלי אכזב עמוקים (קניונים).',
    elev:'מ־כ־800 מ׳ עד ל־430- מ׳ (החוף הנמוך ביבשה) — הפרש עצום במרחק קצר.',
    nav:'שטח פתוח וחשוף (שדה ראייה מצוין) אך הנחלים העמוקים והמצוקים חוסמים ומסכנים; מחייב תכנון ציר זהיר.',
    feat:'קווי גובה צפופים מאוד, מצוקים, נחלי אכזב, מעטה צומח דליל.' },
  negev_north: { name:'צפון הנגב ובקעת באר שבע', color:'#c19a5b', label:'צ. הנגב',
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
    valley: { u: 0.57, v: 0.78, txt: 'גיא — השקע המוארך שבין השלוחות, נתיב ניקוז המים; בקרקעיתו חתור הערוץ (אפיק הזרימה עצמו). קווי הגובה יוצרים ⋁ שקודקודו במעלה.' },
    all:    { txt: 'זהו מרחב עם שתי פסגות, אוכף ביניהן, שלוחה יורדת מהפסגה, וגיא ניקוז שבקרקעיתו ערוץ. גררו את המפלס — ראו כיצד "טבעת" קו הגובה נעה עם הגובה.' }
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
  // שוליים נפרדים לכל צד — נשמור מקום לתוויות ולכותרות הצירים
  const ML = 46, MT = 30, MR = 16, MB = 48;
  const N = 5;                                        // 5x5 משבצות (ק״מ)
  const PLOT = Math.min(W - ML - MR, H - MT - MB);    // אזור שרטוט מרובע שנכנס בקנבס
  const px = PLOT / N;                                // פיקסלים לק״מ
  const X0 = ML, Y1 = MT + PLOT;                      // פינת מוצא (שמאל-תחתון) של הרשת
  const baseE = 23, baseN = 67;    // קווי רשת בסיס (מוצגים כשתי ספרות)
  let mode = 'read';
  let target = null;               // {eastVal, northVal, e3, n3}
  let clicked = null;

  // מזרחית גדלה ימינה, צפונית גדלה כלפי מעלה (כמו במפה)
  const toX = eVal => X0 + (eVal - baseE) * px;
  const toY = nVal => Y1 - (nVal - baseN) * px;
  const fromX = x => baseE + (x - X0) / px;
  const fromY = y => baseN + (Y1 - y) / px;

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
      const x = X0 + i * px / 10, y = Y1 - i * px / 10;
      ctx.beginPath(); ctx.moveTo(x, MT); ctx.lineTo(x, Y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X0 + PLOT, y); ctx.stroke();
    }
    // קווי רשת ראשיים (ק״מ) + תוויות
    ctx.strokeStyle = '#7d8c4e'; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#33421f'; ctx.font = 'bold 15px Heebo, sans-serif';
    for (let i = 0; i <= N; i++) {
      const x = X0 + i * px;                 // קו מזרחית אנכי
      const y = Y1 - i * px;                  // קו צפונית אופקי (i=0 למטה, i=N למעלה)
      ctx.beginPath(); ctx.moveTo(x, MT); ctx.lineTo(x, Y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X0 + PLOT, y); ctx.stroke();
      // תווית מזרחית מתחת לרשת — גדלה משמאל (23) לימין (28)
      ctx.textAlign = 'center';
      ctx.fillText(String(baseE + i), x, Y1 + 20);
      // תווית צפונית משמאל לרשת — גדלה מלמטה (67) למעלה (72)
      ctx.textAlign = 'right';
      ctx.fillText(String(baseN + i), X0 - 8, y + 5);
    }
    // חץ צפון (↑) בפינה — מבהיר שהצפון כלפי מעלה
    const ax = X0 + PLOT - 16, ay0 = MT + 34, ay1 = MT + 8;
    ctx.strokeStyle = '#b5482f'; ctx.fillStyle = '#b5482f'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay1 - 2); ctx.lineTo(ax - 5, ay1 + 7); ctx.lineTo(ax + 5, ay1 + 7); ctx.closePath(); ctx.fill();
    ctx.font = 'bold 13px Heebo, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('צ', ax, ay0 + 14);
    // כותרות צירים
    ctx.fillStyle = '#4a5d2b'; ctx.font = '600 13px Heebo, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('מזרחית (ק״מ)', X0 + PLOT / 2, H - 8);
    ctx.save(); ctx.translate(14, MT + PLOT / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('צפונית (ק״מ)', 0, 0); ctx.restore();

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
    if (x < X0 || x > X0 + PLOT || y < MT || y > Y1) return;
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
  svg.appendChild(mk('circle', { cx: ox, cy: oy, r: 5, fill: '#8a9078' }));
  line(-gridConv, '#6b8138', 4, 'רשת', -14);    // צפון רשת (מעט שמאלה)
  line(0, '#9aa08a', 3, 'אמיתי', 0);            // צפון אמיתי (אפור — קריא בשני המצבים)
  line(decl, '#d4593f', 4, 'מגנטי', 16);        // צפון מגנטי (מזרחה=ימינה)
  // קשת סטייה
  svg.appendChild(mk('path', { d: `M ${ox},${oy - 70} A 70 70 0 0 1 ${ox + 70 * Math.sin(rad(decl))},${oy - 70 * Math.cos(rad(decl))}`, fill: 'none', stroke: '#b5482f', 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }));
  svg.appendChild(mk('text', { x: ox + 26, y: oy - 82, fill: '#d4593f', 'font-size': 12, 'font-weight': 700 }, '≈5° מזרחה'));
  svg.appendChild(mk('text', { x: ox, y: oy + 30, fill: '#9aa08a', 'font-size': 11, 'text-anchor': 'middle' }, 'נקודת התצפית'));
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
  let wps = [];                    // {x,y,name,type}
  let wpType = 'נ.ה';
  const TYPE_COLORS = { 'נ.ה':'#4a5d2b', 'נ.צ':'#33421f', 'מ.ח':'#b5482f', 'נ.ב':'#a9743a', 'נ.ס':'#26301c' };
  const strideEl = document.getElementById('stride');
  document.querySelectorAll('#wpTypeSeg button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#wpTypeSeg button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); wpType = b.dataset.type;
    });
  });

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
      ctx.fillStyle = TYPE_COLORS[w.type] || '#33421f'; ctx.beginPath(); ctx.arc(w.x, w.y, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Heebo, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), w.x, w.y + 4);
      // תווית סוג + שם מעל הנקודה
      const lbl = w.type + (w.name ? ' · ' + w.name : '');
      ctx.font = '700 11px Heebo, sans-serif';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillRect(w.x - tw / 2 - 4, w.y - 26, tw + 8, 15);
      ctx.fillStyle = TYPE_COLORS[w.type] || '#22271c';
      ctx.fillText(lbl, w.x, w.y - 15);
    });
    updateCard();
  }

  const DIR8 = ['צפון', 'צפון־מזרח', 'מזרח', 'דרום־מזרח', 'דרום', 'דרום־מערב', 'מערב', 'צפון־מערב'];
  const dirName = az => DIR8[Math.round(norm360(az) / 45) % 8];

  function updateCard() {
    const tbody = document.querySelector('#navCard tbody');
    const skelWrap = document.getElementById('storySkeleton');
    const skelBody = document.getElementById('storySkelBody');
    const stride = +strideEl.value / 100; // מ׳
    let total = 0;
    if (wps.length < 2) {
      tbody.innerHTML = '<tr><td colspan="8" class="small" style="text-align:center;color:var(--text-soft)">הניחו לפחות שתי נקודות כדי לייצר כרטיס ניווט…</td></tr>';
      if (skelWrap) skelWrap.classList.add('hidden');
    } else {
      let html = '', skelHtml = '';
      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i], b = wps[i + 1];
        const de = (b.x - a.x) / px, dn = -(b.y - a.y) / px; // ק״מ
        const distKm = Math.hypot(de, dn);
        const distM = distKm * 1000; total += distM;
        const gridAz = azimuth(de, dn);
        const magAz = norm360(gridAz - DECL);
        const steps = Math.round(distM / stride);
        const from = (a.type || 'נק׳') + (a.name ? ' ' + a.name : ' ' + (i + 1));
        const to = (b.type || 'נק׳') + (b.name ? ' ' + b.name : ' ' + (i + 2));
        html += `<tr>
          <td class="leg-num">${i + 1}</td>
          <td>${from} ← ${to}</td>
          <td>${b.type || '—'}</td>
          <td>${nz(b.x, b.y)}</td>
          <td>${gridAz.toFixed(0)}°</td>
          <td>${magAz.toFixed(0)}°</td>
          <td>${fmtDist(distM)}</td>
          <td>${steps.toLocaleString('he-IL')}</td>
        </tr>`;
        skelHtml += `<div class="leg-story"><b>רגל ${i + 1}:</b> יוצאים מ<b>${from}</b> ב${dirName(gridAz)} (אזימוט מגנטי ${magAz.toFixed(0)}°), מתקדמים <b>${fmtDist(distM)}</b> (כ־${steps.toLocaleString('he-IL')} צעדים).
          בדרך אזהה: <span class="blank">מה רואים בדרך?</span> ·
          גבול ברור: <span class="blank">מה מעבר לנקודה?</span> ·
          בנקודה — <b>${to}</b>: <span class="blank">איך מזהים אותה?</span></div>`;
      }
      tbody.innerHTML = html;
      if (skelWrap && skelBody) { skelWrap.classList.remove('hidden'); skelBody.innerHTML = skelHtml; }
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
    wps.push({ x, y, name: nameEl.value.trim(), type: wpType });
    nameEl.value = '';
    draw();
  });

  document.getElementById('undoWp').addEventListener('click', () => { wps.pop(); draw(); });
  document.getElementById('clearWp').addEventListener('click', () => { wps = []; draw(); });
  strideEl.addEventListener('input', () => { document.getElementById('strideShow').textContent = strideEl.value; updateCard(); });

  document.getElementById('printCard').addEventListener('click', () => {
    if (wps.length < 2) { alert('הניחו לפחות שתי נקודות ביקורת לפני ההדפסה.'); return; }
    const rows = document.querySelector('#navCard tbody').innerHTML;
    const skel = document.getElementById('storySkelBody');
    const skelHtml = skel && skel.innerHTML.trim() ? `<h2>שלד סיפור דרך</h2>${skel.innerHTML}` : '';
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>כרטיס ניווט</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}h1,h2{color:#33421f}
      table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #999;padding:8px;text-align:center}
      th{background:#33421f;color:#fff}.meta{color:#555;font-size:14px}
      .leg-story{border:1px solid #bbb;border-right:4px solid #7d8c4e;border-radius:6px;padding:9px 12px;margin:8px 0;line-height:1.8}
      .blank{display:inline-block;min-width:130px;border-bottom:2px dotted #a9743a;color:#a9743a;font-size:0.85em;text-align:center;padding:0 6px}</style></head><body>
      <h1>כרטיס ניווט</h1>
      <p class="meta">סטייה מגנטית בשימוש: ${DECL}° · אורך צעד: ${strideEl.value} ס״מ · מספר צלעות: ${wps.length - 1}</p>
      <table><thead><tr><th>רגל</th><th>מ־ ← אל</th><th>סוג</th><th>נ״צ יעד</th><th>אזימוט רשת</th><th>אזימוט מגנטי</th><th>מרחק</th><th>אומדן צעדים</th></tr></thead>
      <tbody>${rows}</tbody></table>
      ${skelHtml}
      <p class="meta">הופק באתר "הניווטיה". לאימות תמיד השוו למפה המעודכנת ולנהלים.</p>
      </body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
  });

  draw();
})();

/* =======================================================================
   2א. מהצילום למפה — השוואה אמיתית, רב־אתרים
   ======================================================================= */
(() => {
  const photo = document.getElementById('realPhoto');
  if (!photo) return;
  const photoImg = document.getElementById('realPhotoImg');
  const sitesSeg = document.getElementById('realSites');
  const seg = document.getElementById('realSeg');
  const mapImg = document.getElementById('realMapImg');
  const cap = document.getElementById('realCap');
  const credit = document.getElementById('realCredit');

  const GUSH_CREDIT = 'גוש עציון: התצלום וקטעי המפה מתוך מצגת שיעור 1 (כפר עציון, גבעת הסלעים והכיפה 967). במפות המסומנות: כחול = כיוון עלייה, אדום = כיוון ירידה.';
  const OTM = 'מפה: © OpenStreetMap contributors, SRTM · סגנון: OpenTopoMap (CC-BY-SA). העיגול האדום — בקואורדינטות המדויקות.';

  const SITES = [
    { key: 'gush', label: 'גוש עציון (מהשיעור)', photo: 'assets/real/gush-photo.jpg',
      alt: 'תצלום נוף של גוש עציון', credit: GUSH_CREDIT,
      forms: [
        { key: 'kipa', label: 'כיפה', pin: [47.5, 29.5], img: 'assets/real/map-kipa.png',
          cap: 'הגבעה הכהה שבמרכז התצלום היא כיפה — נקודת שיא מקומית שיורדים ממנה לכל כיוון. במפה: קווי הגובה נסגרים בטבעות סביב נקודת הגובה 967 — מכל כיוון שיוצאים ממנה, יורדים.' },
        { key: 'shlucha', label: 'שלוחה', pin: [38.5, 42.1], img: 'assets/real/map-shlucha-gai.png',
          cap: 'הכתף היורדת מהכיפה שמאלה היא שלוחה — הקרקע הגבוהה שעולה בין הגיאיות (החץ הכחול במפה). בראשה כיוון עלייה אחד ושלושה כיווני ירידה; לעלות עליה זו הדרך הבטוחה לטפס לכיפה.' },
        { key: 'gai', label: 'גיא', pin: [70.0, 50.5], img: 'assets/real/map-shlucha-gai.png',
          cap: 'רצועת העצים שבין הכיפה לרכס שמימין — שם עובר הגיא (החץ האדום במפה), והוא יורד היישר מהאוכף שמעליו: תמיד בין שתי שלוחות, המים יורדים בו אל הנחל. במפה קודקוד קווי הגובה מצביע במעלה, והנחל האכזב מסומן בקו כחול מקווקו בקרקעיתו.' },
        { key: 'okaf', label: 'אוכף', pin: [71.9, 32.0], img: 'assets/real/map-okaf.png',
          cap: 'הביטו בקו הגג של הרכס: שתי בליטות מיוערות, וביניהן שקע — שדרך ה"פתח" שלו נשקף השטח שמאחור. זה אוכף: הנקודה הנמוכה שבין שני בלטים, ושימו לב שהגיא (הסמן שמתחת) יורד בדיוק ממנו — כי מאוכף יורדות שתי ירידות אל הגיאיות. במפה (דוגמה מאותו אזור): האוכף שבין 949 ל־967, והשביל חוצה דווקא בו.' }
      ] },
    { key: 'tabor', label: 'הר תבור — כיפה', photo: 'assets/real/tabor.jpg',
      alt: 'הר תבור', map: 'assets/real/map-tabor.png',
      credit: 'הר תבור — תצלום: Ilan Costica, ויקישיתוף (CC BY 3.0) · ' + OTM,
      forms: [
        { key: 'tkipa', label: 'כיפה', pin: [41.0, 30.5],
          cap: 'הר תבור (575 מ׳) — הכיפה המפורסמת של ישראל: מתרומם לבדו מעמק יזרעאל, יורד לכל הכיוונים. במפה: טבעות קווי גובה סגורות זו בתוך זו סביב הפסגה (העיגול האדום — נ״צ הפסגה המדויקת), והדרך המתפתלת בסרפנטינות במדרון — סימן מובהק לתלילות.' }
      ] },
    { key: 'masada', label: 'מצדה — שלוחה · גיא · מצוק', photo: 'assets/real/masada.jpg',
      alt: 'מצדה מהאוויר — הסוללה הרומית', map: 'assets/real/map-masada.png',
      credit: 'מצדה — תצלום אוויר: Neukoln / WikiAir, ויקישיתוף (CC BY-SA 3.0) · ' + OTM,
      forms: [
        { key: 'mshl', label: 'שלוחה (הסוללה)', pin: [46, 45],
          cap: 'הרכס הבהיר שמטפס אל ההר ממערב הוא שלוחה טבעית — שעליה בנו הרומאים את סוללת המצור. שימו לב איך השביל עולה בדיוק על קו הגב שלה: תוואי העלייה הבטוח. במפה: הרכס הצר שמחבר את הרמה אל הגב ההררי ממערב (העיגול האדום — נ״צ המצודה).' },
        { key: 'mgai', label: 'גיא', pin: [36, 58],
          cap: 'משני צידי השלוחה חותרים ואדיות עמוקים — הגיאיות שמנקזים את ההר (נחל מצדה ושכניו). בתצלום רואים את החתירה בדיוק מתחת לבסיס הסוללה. במפה: הקווים הכחולים המקווקווים העוטפים את ההר משני עבריו.' },
        { key: 'mtsuk', label: 'מצוק', pin: [22, 32],
          cap: 'קירות הסלע האנכיים של מצדה — מצוק קלאסי: שינוי גובה חד כמעט ללא מרחק אופקי. במפה אי אפשר לצייר שם קווי גובה נפרדים — לכן מופיע סימון השנתות (השיניים השחורות) סביב הרמה כולה.' }
      ] },
    { key: 'ramon', label: 'מכתש רמון — שקע סגור', photo: 'assets/real/ramon.jpg',
      alt: 'מכתש רמון מהשפה', map: 'assets/real/map-ramon.png',
      credit: 'מכתש רמון — תצלום אוויר: Godot13, ויקישיתוף (CC BY-SA 4.0) · ' + OTM,
      forms: [
        { key: 'rmakh', label: 'מכתש (שקע סגור)', pin: [52, 62],
          cap: 'מבט מעל השפה אל רצפת המכתש — שקע ענק שכולו מוקף קירות: מהשטח רואים רק "קיר ורצפה", ורק המפה חושפת שהצורה סגורה לגמרי. במפה: האליפסה המוארכת של המכתש, ומצפה רמון (העיגול האדום — הנ״צ המדויק) יושבת בדיוק על השפה הצפונית; כביש 40 יורד אל תוכו במעלה העצמאות.' }
      ] }
  ];

  let site = null;
  function selectForm(key) {
    const f = site.forms.find(x => x.key === key);
    mapImg.src = f.img || site.map;
    cap.innerHTML = `<b>${f.label}:</b> ${f.cap}`;
    photo.querySelectorAll('.pin').forEach(p => p.classList.toggle('on', p.dataset.key === key));
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === key));
  }

  function renderSite(key) {
    site = SITES.find(x => x.key === key);
    photoImg.src = site.photo; photoImg.alt = site.alt;
    credit.textContent = site.credit;
    photo.querySelectorAll('.pin').forEach(p => p.remove());
    seg.innerHTML = '';
    site.forms.forEach(f => {
      const pin = document.createElement('button');
      pin.className = 'pin'; pin.dataset.key = f.key;
      pin.style.left = f.pin[0] + '%'; pin.style.top = f.pin[1] + '%';
      pin.setAttribute('aria-label', f.label);
      pin.innerHTML = `<span class="tag">${f.label}</span><span class="dot"></span>`;
      pin.addEventListener('click', () => selectForm(f.key));
      photo.appendChild(pin);
      const btn = document.createElement('button');
      btn.dataset.key = f.key; btn.textContent = f.label;
      btn.addEventListener('click', () => selectForm(f.key));
      seg.appendChild(btn);
    });
    sitesSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === key));
    selectForm(site.forms[0].key);
  }

  SITES.forEach(s => {
    const b = document.createElement('button');
    b.dataset.key = s.key; b.textContent = s.label;
    b.addEventListener('click', () => renderSite(s.key));
    sitesSeg.appendChild(b);
  });
  renderSite('gush');
})();

/* =======================================================================
   2ב. קריאת מפה בפרקטיקה — מחשבון שיפוע
   ======================================================================= */
(() => {
  const iv = document.getElementById('slopeIntervals');
  if (!iv) return;
  const dist = document.getElementById('slopeDist');
  const interval = document.getElementById('slopeInterval');
  function calc() {
    const n = Math.max(0, +iv.value || 0);
    const step = Math.max(1, +interval.value || 10);
    const d = Math.max(1, +dist.value || 1);
    const rise = n * step;
    const pct = rise / d * 100;
    const deg = Math.atan2(rise, d) * 180 / Math.PI;
    document.getElementById('slopeRise').textContent = rise.toLocaleString('he-IL') + ' מ׳';
    document.getElementById('slopePct').textContent = pct.toFixed(1) + '%';
    document.getElementById('slopeDeg').textContent = deg.toFixed(1) + '°';
  }
  [iv, dist, interval].forEach(el => el.addEventListener('input', calc));
  calc();
})();

/* =======================================================================
   6ב. סיפור דרך — מפה + משחק סידור המשפטים
   ======================================================================= */
(() => {
  const cv = document.getElementById('storyCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const INTERVAL = 10;

  /* --- תבליט: שתי גבעות, אוכף, ערוץ היורד לדרך עפר --- */
  const gauss = (u, v, cu, cv2, su, sv) => Math.exp(-(((u - cu) ** 2) / (2 * su * su) + ((v - cv2) ** 2) / (2 * sv * sv)));
  function dSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  // ציר הערוץ (u,v): מראש הערוץ מתחת לאוכף אל צומת דרך העפר
  const CH = [[0.52, 0.42], [0.60, 0.58], [0.70, 0.74], [0.76, 0.84]];
  function chDist(u, v) {
    let m = Infinity;
    for (let i = 0; i < CH.length - 1; i++) m = Math.min(m, dSeg(u, v, CH[i][0], CH[i][1], CH[i + 1][0], CH[i + 1][1]));
    return m;
  }
  function heightAt(u, v) {
    let h = 18;
    h += 72 * gauss(u, v, 0.22, 0.40, 0.15, 0.17);   // פסגה מערבית (נ.ה)
    h += 58 * gauss(u, v, 0.72, 0.24, 0.20, 0.13);   // רכס צפון־מזרחי
    const d = chDist(u, v);
    h -= 34 * Math.exp(-(d * d) / (2 * 0.055 * 0.055)); // חריצת הערוץ
    h -= 14 * Math.max(0, (v - 0.62) / 0.38);           // הנמכה כללית דרומה אל הדרך
    return Math.max(0, h);
  }

  const P = (u, v) => [u * W, v * H];
  // נקודות עלילה
  const START = P(0.22, 0.40);       // נ.ה — פסגה מערבית
  const SADDLE = P(0.47, 0.335);     // האוכף
  const CHHEAD = P(0.52, 0.42);      // ראש הערוץ
  const JUNCTION = P(0.76, 0.84);    // מפגש ערוץ×דרך (קו עצירה + נקודת תקיפה)
  const WATER = P(0.90, 0.845);      // בור המים — הנקודה
  const ROAD_Y = 0.845;              // דרך העפר (אופקית)
  const TREE = P(0.24, 0.845);       // עץ בודד — נקודת עזיבה בתרגיל ב׳

  function haloText(c, txt, x, y, size = 12, color = '#22271c', weight = 700) {
    c.font = `${weight} ${size}px Heebo, sans-serif`; c.textAlign = 'center';
    c.lineWidth = 3.5; c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.strokeText(txt, x, y); c.fillStyle = color; c.fillText(txt, x, y);
  }

  let base = null;
  function buildBase() {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const hs = new Float32Array(W * H);
    let mn = Infinity, mx = -Infinity;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const h = heightAt(x / W, y / H); hs[y * W + x] = h;
      if (h < mn) mn = h; if (h > mx) mx = h;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, h = hs[i], t = (h - mn) / (mx - mn);
      let r, g, b;
      if (t < 0.5) { const k = t / 0.5; r = 122 + k * 58; g = 142 + k * 28; b = 82 + k * 18; }
      else { const k = (t - 0.5) / 0.5; r = 180 + k * 40; g = 170 - k * 30; b = 100 - k * 40; }
      const band = Math.floor(h / INTERVAL);
      const bl = x > 0 ? Math.floor(hs[i - 1] / INTERVAL) : band;
      const bu = y > 0 ? Math.floor(hs[i - W] / INTERVAL) : band;
      const isC = band !== bl || band !== bu;
      const p = i * 4;
      if (isC) { const c = band % 5 === 0 ? 70 : 110; d[p] = c; d[p + 1] = c * 0.7; d[p + 2] = c * 0.4; }
      else { d[p] = r; d[p + 1] = g; d[p + 2] = b; }
      d[p + 3] = 255;
    }
    base = img;
  }

  function paintScenery(c, variant) {
    // הערוץ (כחול)
    c.strokeStyle = '#4a7c8c'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath();
    CH.forEach(([u, v], i) => { const [x, y] = P(u, v); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
    // דרך עפר (מקווקו שחור)
    c.strokeStyle = '#2b2f22'; c.lineWidth = 2.5; c.setLineDash([9, 6]);
    c.beginPath(); c.moveTo(0.04 * W, ROAD_Y * H); c.lineTo(0.97 * W, ROAD_Y * H); c.stroke();
    c.setLineDash([]);
    // בור מים (סמל מפה: עיגול כחול)
    c.fillStyle = '#fff'; c.beginPath(); c.arc(WATER[0], WATER[1], 8, 0, TAU); c.fill();
    c.strokeStyle = '#4a7c8c'; c.lineWidth = 2.5; c.beginPath(); c.arc(WATER[0], WATER[1], 8, 0, TAU); c.stroke();
    c.fillStyle = '#4a7c8c'; c.beginPath(); c.arc(WATER[0], WATER[1], 3, 0, TAU); c.fill();
    // דגל על הפסגה המערבית
    c.strokeStyle = '#26301c'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(START[0], START[1]); c.lineTo(START[0], START[1] - 20); c.stroke();
    c.fillStyle = variant === 'B' ? '#b5482f' : '#4e9a3a';
    c.beginPath(); c.moveTo(START[0], START[1] - 20); c.lineTo(START[0] - 15, START[1] - 14); c.lineTo(START[0], START[1] - 8); c.closePath(); c.fill();
    // תוויות משותפות
    haloText(c, 'האוכף', SADDLE[0], SADDLE[1] - 8, 11, '#6b4c22');
    haloText(c, 'הערוץ', P(0.585, 0.60)[0] + 16, P(0.585, 0.60)[1], 11, '#2e5866');
    haloText(c, 'דרך עפר', 0.14 * W, ROAD_Y * H - 8, 11, '#2b2f22');
    haloText(c, 'בור מים', WATER[0], WATER[1] + 22, 11, '#2e5866', 800);
    if (variant === 'A') {
      haloText(c, 'נ.ה', START[0] + 2, START[1] + 16, 12, '#26301c', 800);
    } else {
      // עץ בודד — נקודת העזיבה של תרגיל ב׳
      const [tx, ty] = TREE;
      c.strokeStyle = '#5a4326'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - 10); c.stroke();
      c.fillStyle = '#3f6b2e'; c.beginPath(); c.arc(tx, ty - 15, 8, 0, TAU); c.fill();
      c.strokeStyle = '#2c4d20'; c.lineWidth = 1.5; c.beginPath(); c.arc(tx, ty - 15, 8, 0, TAU); c.stroke();
      haloText(c, 'עץ בודד', tx, ty + 15, 11, '#2c4d20', 800);
      haloText(c, 'התחלה', WATER[0], WATER[1] - 16, 12, '#26301c', 800);
      haloText(c, 'היעד', START[0] + 2, START[1] + 16, 12, '#b5482f', 800);
    }
  }

  function drawScene(prog) { // prog = כמה קטעי ציר לצייר (0..SEGS.length)
    if (!base) buildBase();
    ctx.putImageData(base, 0, 0);
    paintScenery(ctx, 'A');
    // קטעי הציר שכבר "סופרו"
    ctx.strokeStyle = '#b5482f'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.setLineDash([1, 7]);
    for (let s = 0; s < prog; s++) SEGS[s] && SEGS[s]();
    ctx.setLineDash([]);
  }

  const dot = (x, y) => { ctx.setLineDash([]); ctx.fillStyle = '#b5482f'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([1, 7]); };
  const seg = (a, b) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  // ציור מצטבר: כל איבר = מה מצטרף כשעוד משפט נענה נכון
  const SEGS = [
    () => { dot(START[0], START[1]); },                                   // 1 יציאה
    () => { seg(START, SADDLE); dot(SADDLE[0], SADDLE[1]); },             // 2 ירידה לאוכף
    () => { seg(SADDLE, CHHEAD); dot(CHHEAD[0], CHHEAD[1]); },            // 3 פנייה לראש הערוץ
    () => { for (let i = 0; i < CH.length - 1; i++) seg(P(...CH[i]), P(...CH[i + 1])); dot(JUNCTION[0], JUNCTION[1]); }, // 4 לאורך הערוץ
    () => { ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = '#d4a02c'; ctx.lineWidth = 3;
            ctx.strokeRect(JUNCTION[0] - 16, JUNCTION[1] - 16, 32, 32); ctx.restore(); },  // 5 קו עצירה/תקיפה
    () => { seg(JUNCTION, WATER); dot(WATER[0], WATER[1]);
            ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = '#4e9a3a'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(WATER[0], WATER[1], 15, 0, TAU); ctx.stroke(); ctx.restore(); } // 6 הנקודה
  ];

  /* --- המשפטים (הסדר הנכון) --- */
  const LINES = [
    'יוצאים מנקודת ההתחלה שבפסגה המערבית, פנים מזרחה — לכיוון האוכף הנראה מתחתינו.',
    'יורדים במדרון המתון אל האוכף שבין שתי הפסגות (נקודת גבייה ראשונה).',
    'מהאוכף פונים ימינה (דרום־מזרח) ויורדים אל ראש הערוץ שמתחת.',
    'נצמדים לערוץ — הקו המוביל שלנו — ועוקבים אחריו במורד, כשהוא מתרחב והולך.',
    'כשהערוץ פוגש את דרך העפר — הגבול הברור (קו העצירה) — עוצרים: זו נקודת התקיפה. אם חצינו את הדרך, הרחקנו.',
    'מהצומת פונים שמאלה (מזרחה) לאורך הדרך כ־200 מ׳ — בור המים בצד הדרך: הגענו לנקודה.'
  ];

  let next = 0;
  const pool = document.getElementById('storyPool');
  const built = document.getElementById('storyBuilt');
  const fb = document.getElementById('storyFeedback');

  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function reset() {
    next = 0; built.innerHTML = ''; fb.textContent = ''; fb.className = 'feedback';
    let order = shuffle(LINES.map((_, i) => i));
    if (order.every((v, i) => v === i)) order = shuffle(order); // לא להתחיל פתור
    pool.innerHTML = '';
    order.forEach(idx => {
      const b = document.createElement('button');
      b.textContent = LINES[idx]; b.dataset.idx = idx;
      b.addEventListener('click', () => pick(b));
      pool.appendChild(b);
    });
    drawScene(0);
  }

  function pick(btn) {
    const idx = +btn.dataset.idx;
    if (idx === next) {
      const li = document.createElement('li'); li.textContent = LINES[idx];
      built.appendChild(li); btn.remove(); next++;
      drawScene(next);
      if (next === LINES.length) { fb.className = 'feedback ok'; fb.textContent = '🎉 סיפור הדרך הושלם — והציר צויר במלואו. כך זה נראה גם בראש של הנווט.'; }
      else { fb.className = 'feedback ok'; fb.textContent = `✓ נכון (${next}/${LINES.length})`; }
    } else {
      btn.classList.add('wrong');
      fb.className = 'feedback bad';
      fb.textContent = next === 0 ? '✗ רגע — מאיפה מתחיל כל סיפור דרך? מנקודת ההתחלה.' : '✗ לא לפי הסדר. איפה אנחנו כרגע על הציר?';
      setTimeout(() => btn.classList.remove('wrong'), 350);
    }
  }

  document.getElementById('storyReset').addEventListener('click', reset);
  reset();

  /* --- תרגיל ב׳ (הפוך): הציר מצויר — כתבו את הסיפור --- */
  const cv2 = document.getElementById('storyCanvas2');
  if (cv2) {
    const ctx2 = cv2.getContext('2d');

    function arrow(c, a, b) {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      c.save(); c.translate(mx, my); c.rotate(ang); c.setLineDash([]);
      c.fillStyle = '#b5482f';
      c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -6); c.lineTo(-5, 6); c.closePath(); c.fill();
      c.restore();
    }

    function drawB() {
      if (!base) buildBase();
      ctx2.putImageData(base, 0, 0);
      paintScenery(ctx2, 'B');
      // ציר ב׳: בור המים ← מערבה לאורך הדרך ← עץ בודד ← טיפוס צפונה לפסגה
      const RB = [WATER, JUNCTION, TREE, START];
      ctx2.strokeStyle = '#b5482f'; ctx2.lineWidth = 3.5; ctx2.lineCap = 'round'; ctx2.setLineDash([1, 7]);
      for (let i = 0; i < RB.length - 1; i++) {
        ctx2.beginPath(); ctx2.moveTo(RB[i][0], RB[i][1]); ctx2.lineTo(RB[i + 1][0], RB[i + 1][1]); ctx2.stroke();
      }
      ctx2.setLineDash([]);
      for (let i = 0; i < RB.length - 1; i++) arrow(ctx2, RB[i], RB[i + 1]);
      // עיגול יעד
      ctx2.strokeStyle = '#b5482f'; ctx2.lineWidth = 3;
      ctx2.beginPath(); ctx2.arc(START[0], START[1], 15, 0, TAU); ctx2.stroke();
    }

    // רכיבי הסיפור שנבדקים (זיהוי מילות מפתח — בדיקת שלמות, לא ציון)
    const CHECKS = [
      { label: 'כיוון היציאה (מערבה)', re: /מערב/, hint: 'לאיזה כיוון יוצאים מבור המים?' },
      { label: 'הקו המוביל (דרך העפר)', re: /דרך|קו מוביל/, hint: 'לאיזה תוואי נצמדים לאורך הרגל?' },
      { label: 'נקודת גבייה (מפגש הערוץ)', re: /ערוץ|צומת|מפגש/, hint: 'מה פוגשים בדרך שמאשר את ההתקדמות?' },
      { label: 'נקודת העזיבה (העץ הבודד)', re: /עץ/, hint: 'איזה תוואי מסמן לכם לעזוב את הדרך?' },
      { label: 'הטיפוס (צפונה / במעלה)', re: /צפונ|מטפס|עול|עלי|במעלה/, hint: 'איך מתארים את הקטע האחרון?' },
      { label: 'זיהוי היעד (הפסגה)', re: /פסג|גבוה/, hint: 'איך יודעים שהגעתם?' },
      { label: 'גבול ברור (התחלת ירידה)', re: /גבול|עציר|לרדת|ירידה|יורד/, hint: 'מה מאותת שעברתם את היעד?' }
    ];

    document.getElementById('storyCheckBtn').addEventListener('click', () => {
      const txt = document.getElementById('storyWrite').value.trim();
      const out = document.getElementById('storyCheck');
      const fb2 = document.getElementById('storyFeedback2');
      if (txt.length < 20) {
        out.innerHTML = '';
        fb2.className = 'feedback bad';
        fb2.textContent = 'כתבו את הסיפור במלואו (לפחות כמה משפטים) ואז בדקו.';
        return;
      }
      let found = 0;
      out.innerHTML = CHECKS.map(c => {
        const ok = c.re.test(txt);
        if (ok) found++;
        return `<span class="check-chip ${ok ? 'ok' : 'miss'}" title="${ok ? '' : c.hint}">${ok ? '✓' : '✗'} ${c.label}</span>`;
      }).join('');
      if (found === CHECKS.length) {
        fb2.className = 'feedback ok';
        fb2.textContent = `🎯 מצוין — כל ${CHECKS.length} רכיבי הסיפור נמצאו! השוו לסיפור לדוגמה לניסוח.`;
      } else {
        fb2.className = 'feedback bad';
        fb2.textContent = `נמצאו ${found} מתוך ${CHECKS.length} רכיבים. רחפו מעל ✗ לרמז, השלימו ובדקו שוב.`;
      }
      document.getElementById('storyModel').classList.remove('hidden');
    });

    drawB();
  }
})();

/* =======================================================================
   7. החלפת מצב תצוגה (Dark / Light)
   ======================================================================= */
(() => {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const sync = () => { btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; };
  sync();
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();

/* =======================================================================
   8. משחק הצלבה: השטח בעין ← השטח במפה (קווי גובה)
   ======================================================================= */
(() => {
  const photosEl = document.getElementById('matchPhotos');
  const mapsEl = document.getElementById('matchMaps');
  if (!photosEl || !mapsEl) return;
  const C = '#a9743a'; // צבע קווי גובה

  // תצוגת "שטח" (מבט תלת־ממדי/צד) ותצוגת "מפה" (קווי גובה) לכל צורה
  const FEATURES = [
    { id:'peak', name:'פסגה', sub:'נקודה גבוהה, יורדת לכל הכיוונים',
      side:`<polygon points="8,52 45,10 82,52" fill="#8a9a5b"/><polygon points="45,10 82,52 55,52" fill="#6b7d3a"/><line x1="45" y1="10" x2="45" y2="52" stroke="#4a5d2b" stroke-width="1"/>`,
      map:`<g fill="none" stroke="${C}" stroke-width="1.6"><ellipse cx="45" cy="31" rx="30" ry="21"/><ellipse cx="45" cy="31" rx="21" ry="14.5"/><ellipse cx="45" cy="31" rx="12" ry="8"/><ellipse cx="45" cy="31" rx="4" ry="2.6"/></g>` },
    { id:'saddle', name:'אוכף', sub:'נקודה נמוכה בין שתי פסגות',
      side:`<path d="M6,52 C16,16 30,16 45,38 C60,16 74,16 84,52 Z" fill="#8a9a5b"/><path d="M6,52 C16,16 30,16 45,38 C60,16 74,16 84,52" fill="none" stroke="#4a5d2b" stroke-width="1"/>`,
      map:`<g fill="none" stroke="${C}" stroke-width="1.6"><path d="M8,31 Q26,14 44,31"/><path d="M46,31 Q64,14 82,31"/><path d="M8,31 Q26,48 44,31"/><path d="M46,31 Q64,48 82,31"/><ellipse cx="24" cy="31" rx="8" ry="6"/><ellipse cx="66" cy="31" rx="8" ry="6"/></g>` },
    { id:'ridge', name:'שלוחה', sub:'לשון גבוהה, קווי גובה ⋀ במורד',
      side:`<path d="M6,52 C26,46 44,26 84,14 L84,52 Z" fill="#8a9a5b"/><path d="M6,52 C26,46 44,26 84,14" fill="none" stroke="#4a5d2b" stroke-width="1.2"/>`,
      map:`<g fill="none" stroke="${C}" stroke-width="1.6"><path d="M14,14 Q45,34 76,14"/><path d="M14,26 Q45,46 76,26"/><path d="M14,38 Q45,58 76,38"/></g>` },
    { id:'valley', name:'גיא (ובקרקעיתו ערוץ)', sub:'השקע שבין הרכסים, קווי גובה ⋁ במעלה',
      side:`<polygon points="6,14 45,52 84,14 84,52 6,52" fill="#8a9a5b"/><polyline points="6,14 45,52 84,14" fill="none" stroke="#4a5d2b" stroke-width="1"/><line x1="45" y1="52" x2="45" y2="30" stroke="#4a7c8c" stroke-width="1.6"/>`,
      map:`<g fill="none" stroke="${C}" stroke-width="1.6"><path d="M14,46 Q45,26 76,46"/><path d="M14,34 Q45,14 76,34"/><path d="M14,58 Q45,38 76,58"/></g><line x1="45" y1="18" x2="45" y2="50" stroke="#4a7c8c" stroke-width="1.4" stroke-dasharray="2 2"/>` },
    { id:'cliff', name:'מצוק', sub:'שינוי גובה חד — קווים נדחסים',
      side:`<path d="M6,52 L6,34 L46,34 L46,12 L84,12 L84,52 Z" fill="#8a9a5b"/><line x1="46" y1="12" x2="46" y2="34" stroke="#b5482f" stroke-width="2.2"/>`,
      map:`<g fill="none" stroke="${C}" stroke-width="1.4"><line x1="14" y1="8" x2="14" y2="52"/><line x1="22" y1="8" x2="22" y2="52"/><line x1="52" y1="8" x2="52" y2="52"/><line x1="55" y1="8" x2="55" y2="52"/><line x1="58" y1="8" x2="58" y2="52"/><line x1="61" y1="8" x2="61" y2="52"/></g><path d="M52,8 l-4,4 M52,20 l-4,4 M52,32 l-4,4 M52,44 l-4,4" stroke="${C}" stroke-width="1"/>` }
  ];

  const svg = inner => `<svg width="70" height="50" viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let selPhoto = null, done = 0;
  const fb = document.getElementById('matchFeedback');

  function render() {
    selPhoto = null; done = 0;
    fb.textContent = ''; fb.className = 'feedback';
    photosEl.querySelectorAll('.match-item').forEach(n => n.remove());
    mapsEl.querySelectorAll('.match-item').forEach(n => n.remove());
    shuffle(FEATURES).forEach(f => {
      const el = document.createElement('div');
      el.className = 'match-item'; el.dataset.id = f.id;
      el.innerHTML = svg(f.side) + `<div><div class="mtext">${f.name}</div><div class="msub">${f.sub}</div></div>`;
      el.addEventListener('click', () => selectPhoto(el));
      photosEl.appendChild(el);
    });
    shuffle(FEATURES).forEach(f => {
      const el = document.createElement('div');
      el.className = 'match-item'; el.dataset.id = f.id;
      el.style.justifyContent = 'center';
      el.innerHTML = svg(f.map);
      el.addEventListener('click', () => selectMap(el));
      mapsEl.appendChild(el);
    });
  }
  function selectPhoto(el) {
    if (el.classList.contains('done')) return;
    photosEl.querySelectorAll('.match-item').forEach(n => n.classList.remove('selected'));
    selPhoto = el; el.classList.add('selected');
  }
  function selectMap(el) {
    if (el.classList.contains('done') || !selPhoto) return;
    if (el.dataset.id === selPhoto.dataset.id) {
      el.classList.add('done'); selPhoto.classList.add('done'); selPhoto.classList.remove('selected');
      selPhoto = null; done++;
      fb.className = 'feedback ok'; fb.textContent = `✓ נכון! (${done}/${FEATURES.length})`;
      if (done === FEATURES.length) fb.textContent = `🎉 מצוין! זיהיתם את כל הצורות (${done}/${FEATURES.length}).`;
    } else {
      el.classList.add('wrong');
      fb.className = 'feedback bad'; fb.textContent = '✗ לא מתאים. שימו לב לתבנית קווי הגובה.';
      setTimeout(() => el.classList.remove('wrong'), 350);
    }
  }
  document.getElementById('matchReset').addEventListener('click', render);
  render();
})();

/* =======================================================================
   9. בוחן — קריאת מפה, ניווט ובטיחות
   ======================================================================= */
(() => {
  const host = document.getElementById('quizCard');
  if (!host) return;
  const Q = [
    { q:'במפה בקנה מידה 1:50,000, כמה מטרים בשטח מייצג סנטימטר אחד במפה?',
      o:['50 מ׳','500 מ׳','5,000 מ׳','1,000 מ׳'], a:1, e:'1:50,000 → 1 ס״מ = 50,000 ס״מ = 500 מ׳. משבצת (2 ס״מ) = 1 ק״מ. [מקור 5]' },
    { q:'מהו פרש הגובה המקובל בין שני קווי גובה סמוכים במפות ישראל (1:50,000 / 1:25,000)?',
      o:['5 מ׳','10 מ׳','25 מ׳','100 מ׳'], a:1, e:'פרש הגובה המקובל הוא 10 מ׳, וכל קו חמישי מודגש כ״קו אב״. [מקור 4]' },
    { q:'קווי גובה צפופים (קרובים זה לזה) מעידים על…',
      o:['מדרון מתון','שטח מישורי','מדרון תלול','ביצה'], a:2, e:'ככל שהקווים צפופים יותר — המדרון תלול יותר; קווים מרוחקים = מדרון מתון. [מקור 4]' },
    { q:'בקריאת נקודת־ציון (נ״צ) — מה קוראים קודם?',
      o:['הצפונית ואז המזרחית','המזרחית ואז הצפונית','הגובה ואז המרחק','לפי סדר אקראי'], a:1, e:'הכלל: "ימין ואז למעלה" — קודם המזרחית (הציר האנכי משמאל לנקודה) ואז הצפונית. [מקור 2]' },
    { q:'אם אזימוט ההליכה שלכם אל המטרה הוא 70°, מהו האזימוט החוזר?',
      o:['110°','160°','250°','290°'], a:2, e:'אזימוט חוזר = אזימוט ± 180°. 70° + 180° = 250°. [מקור 6]' },
    { q:'הצפון המגנטי בישראל נמצא ביחס לצפון הגאוגרפי…',
      o:['מזרחה בכ־5°','מערבה בכ־5°','זהה בדיוק','מזרחה בכ־20°'], a:0, e:'בישראל הצפון המגנטי מזרחית לגאוגרפי בכ־4.9°–5° (משתנה עם הזמן). מרשת למצפן מפחיתים את הסטייה. [מקור 7, 11]' },
    { q:'לפי מנחה 011, בציר ניווט רגלי שאורכו 10 ק״מ ומעלה — מה חובה לקבוע?',
      o:['לפחות מנחת מסוקים','לפחות נקודת בקרה (נ.ב) אחת','שני מדריכים','ניווט ביום בלבד'], a:1, e:'בציר רגלי ≥10 ק״מ חובה לפחות נ.ב אחת שכל המנווטים עוברים דרכה (בקרה ע״י חפ״ק). [מקור 13]' },
    { q:'לפי מנחה 011, מהו המרחק המזערי שבו מותר לקבוע נקודת ניווט מבאר, בור או מכשול פתוח?',
      o:['20 מ׳','50 מ׳','100 מ׳','200 מ׳'], a:3, e:'אין לקבוע נ״צ/נ.ה/מ.ח/נ.ב/נ.ס במרחק קטן מ־200 מ׳ ממכשולים פתוחים, תוך ציונם בתדריך. [מקור 13]' },
    { q:'לפי מנחה 011, מהו ציון המעבר במבחן הבטיחות בנושא "ניווטים"?',
      o:['60','70','85','100'], a:2, e:'כל מנווט חייב לעבור מבחן בטיחות בנושא ניווטים בציון 85 לפחות לפני ביצוע ניווט. [מקור 13]' },
    { q:'כיצד ייראו קווי הגובה של גיא (שבקרקעיתו זורם הערוץ)?',
      o:['מעגלים סגורים','⋁ שקודקודו פונה במעלה (נגד זרימת המים)','קווים ישרים ומקבילים','⋀ שקודקודו פונה במורד'], a:1, e:'בגיא קווי הגובה יוצרים ⋁ שקודקודו פונה במעלה; בשלוחה הפוך — ⋀ במורד. הערוץ הוא אפיק הזרימה שבקרקעית הגיא. [מקורות 4, 17]' },
    { q:'מהי מטרת הנדב״ר (נוהל דיבור ברדיו) בזמן ניווט?',
      o:['הצפנת ההודעה כך שהאויב לא יבין','דיבור תקין, קצר ומובן ומניעת הפרעות ברשת','הגדלת טווח מכשיר הקשר','חישוב אזימוט אל המטרה'], a:1, e:'נדב״ר נועד למבנה דיבור תקין, קיצור התקשורת, מניעת הפרעות ווידוא הבנה — מטרתו אינה הצפנה. [מקור 14]' },
    { q:'בסיפור דרך — מהו "גבול ברור" (קו עצירה)?',
      o:['הקו שבו עוצרים למנוחה ושתייה','נקודה שאם הגענו אליה — עברנו את המקטע ("התברברנו")','הקו שמפריד בין גזרות הניווט','קו הרשת הקרוב ביותר לנקודה'], a:1, e:'הגבול הברור הוא רשת הביטחון של המקטע: תוואי ברור מעבר לנקודה (לרוב תחילת ירידה) — אם הגעתם אליו, עברתם וחוזרים. [מקורות 15, 16, 18]' },
    { q:'בין שתי נקודות על המפה נספרו 6 מרווחים בין קווי גובה (פרש 10 מ׳). מה הפרש הגובה ביניהן?',
      o:['6 מ׳','30 מ׳','60 מ׳','600 מ׳'], a:2, e:'הפרש הגובה = מספר המרווחים × פרש הגובה: 6 × 10 = 60 מ׳. כך מחשבים גם שיפוע: הפרש גובה חלקי מרחק אופקי. [מקור 4]' },
    { q:'מקטע באורך אופקי של 600 מ׳ חוצה 7 קווי גובה בעלייה. מהו מרחק ההליכה המחושב?',
      o:['600 מ׳','630 מ׳','670 מ׳','740 מ׳'], a:2, e:'מרחק הליכה = אופקי + אנכי: על כל קו גובה שחוצים בעלייה מוסיפים 10 מ׳ → 600 + 70 = 670 מ׳ (בירידה לא מוסיפים). [מקור 18]' },
    { q:'מדוע כיפה סמויה אינה מסומנת במפה בקו גובה סגור?',
      o:['כי היא סודית','כי גובהה נמוך מפרש הגובה (10 מ׳) בין קווים סמוכים','כי היא מכוסה יער','כי אין עליה נקודת גובה'], a:1, e:'כיפה סמויה בולטת פחות מפרש הגובה (10 מ׳), ולכן אין סביבה קו סגור. מזהים אותה לפי השלוחות והגיאיות שסביבה. [מקור 18]' },
    { q:'בנדב״ר — התחנה הקולטת לא הבינה את ההודעה. מה היא אומרת?',
      o:['"חזור"','"אמור שנית"','"הקרא"','"קבל תיקון"'], a:1, e:'"אמור שנית" — הקולטת מבקשת מהמשדרת לחזור. לעולם לא "חזור" (עלול להתפרש כחזרה על ביצוע הפקודה); "הקרא" הוא ההפך — המשדרת מבקשת מהקולטת להקריא. [מקור 18]' }
  ];
  let i = 0, score = 0, answered = false;

  function render() {
    if (i >= Q.length) { return finish(); }
    const q = Q[i]; answered = false;
    host.innerHTML = `
      <div class="quiz-progress">שאלה ${i + 1} מתוך ${Q.length} · ניקוד נוכחי: ${score}</div>
      <p class="quiz-q">${q.q}</p>
      <div class="quiz-opts">${q.o.map((op, k) => `<button class="quiz-opt" data-k="${k}">${op}</button>`).join('')}</div>
      <div class="quiz-explain hidden" id="qExplain"></div>
      <button class="btn hidden" id="qNext" style="margin-top:14px">${i === Q.length - 1 ? 'לתוצאה' : 'לשאלה הבאה ←'}</button>`;
    host.querySelectorAll('.quiz-opt').forEach(b => b.addEventListener('click', () => answer(+b.dataset.k)));
    host.querySelector('#qNext').addEventListener('click', () => { i++; render(); });
  }
  function answer(k) {
    if (answered) return; answered = true;
    const q = Q[i];
    const opts = host.querySelectorAll('.quiz-opt');
    opts.forEach((b, idx) => { b.disabled = true; if (idx === q.a) b.classList.add('correct'); });
    if (k === q.a) { score++; }
    else { opts[k].classList.add('incorrect'); }
    const ex = host.querySelector('#qExplain');
    ex.className = 'quiz-explain note' + (k === q.a ? '' : ' warn');
    ex.innerHTML = (k === q.a ? '<b>✓ נכון! </b>' : '<b>✗ לא מדויק. </b>') + q.e;
    host.querySelector('#qNext').classList.remove('hidden');
  }
  function finish() {
    const pct = Math.round(score / Q.length * 100);
    const pass = pct >= 85;
    host.innerHTML = `
      <div class="quiz-result">
        <div class="score">${pct}</div>
        <div class="verdict" style="color:${pass ? '#4e9a3a' : 'var(--danger)'}">${pass ? '✓ עברת! (ציון מעבר 85)' : 'עדיין לא — ציון המעבר הוא 85'}</div>
        <p>ענית נכון על ${score} מתוך ${Q.length} שאלות.</p>
        <p class="small">בשטח, מבחן הבטיחות בניווטים הוא תנאי חובה לפני ביצוע ניווט (מנחה 011).</p>
        <button class="btn" id="qRestart" style="margin-top:10px">מבחן חוזר ↻</button>
      </div>`;
    host.querySelector('#qRestart').addEventListener('click', () => { i = 0; score = 0; render(); });
  }
  render();
})();

/* ---------- אתחול ---------- */
buildMap();

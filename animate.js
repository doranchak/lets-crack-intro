// Intro animation: the cipher grid flickers through random symbols and
// gradually fades to reveal a title inside a bordered box.

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// return random integer in inclusive interval [min, max]
function random(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function shuffle(array) {
	array.sort(() => Math.random() - 0.5);
}

// ---- Color schemes -------------------------------------------------------
// Each scheme drives: the color cells fade from/to during the flicker, the
// page background they fade into, and the title box's background/border/text.
var COLOR_SCHEMES = [
	{ name: "Classic",              bgStart: [255, 255, 192], textStart: [0, 0, 0],       pageBg: [255, 255, 255], boxBg: "#f0f0f0", boxBorder: "#990000", titleColor: "#ff0000" },
	{ name: "Sepia Parchment",      bgStart: [222, 196, 150], textStart: [40, 26, 13],     pageBg: [244, 232, 208], boxBg: "#e8d9b5", boxBorder: "#6b4423", titleColor: "#7a1f1f" },
	{ name: "Midnight Cipher",      bgStart: [20, 40, 70],    textStart: [170, 225, 255],  pageBg: [8, 14, 26],     boxBg: "#0d1b2a", boxBorder: "#3fa7ff", titleColor: "#7fdbff" },
	{ name: "Enigma Brass",         bgStart: [60, 42, 18],    textStart: [230, 190, 90],   pageBg: [16, 12, 7],     boxBg: "#1c140b", boxBorder: "#d4af37", titleColor: "#f0c869" },
	{ name: "Bletchley Chalkboard", bgStart: [40, 58, 48],    textStart: [255, 255, 255],  pageBg: [18, 28, 22],    boxBg: "#1f2f27", boxBorder: "#e8e8e0", titleColor: "#ffffff" },
	{ name: "Typewriter Ink",       bgStart: [255, 244, 214], textStart: [15, 15, 15],     pageBg: [250, 247, 240], boxBg: "#f2ede0", boxBorder: "#2b2b2b", titleColor: "#b3121b" },
	{ name: "Matrix Green",         bgStart: [0, 40, 10],     textStart: [0, 255, 90],     pageBg: [0, 4, 0],       boxBg: "#001a00", boxBorder: "#00ff41", titleColor: "#b6ffcf" },
	{ name: "Blood Moon",           bgStart: [60, 10, 10],    textStart: [255, 90, 70],    pageBg: [10, 2, 2],      boxBg: "#200404", boxBorder: "#ff3b30", titleColor: "#ff6a5a" },
	{ name: "Naval Signal",         bgStart: [210, 225, 245], textStart: [5, 20, 50],      pageBg: [245, 248, 252], boxBg: "#dbe6f2", boxBorder: "#0a2f5c", titleColor: "#c81d25" },
	{ name: "Rosetta Sand",         bgStart: [200, 160, 90],  textStart: [60, 40, 15],     pageBg: [237, 214, 169], boxBg: "#e6c98a", boxBorder: "#8a5a2b", titleColor: "#7a2e12" }
];

var currentScheme = COLOR_SCHEMES[0];

function rgbStr(a) {
	return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")";
}

function clamp255(v) {
	return Math.max(0, Math.min(255, v));
}

// t is allowed to go outside [0,1]; the result is clamped to a valid color,
// so t>1 overshoots past b (used to briefly boost highlight contrast).
function lerpColor(a, b, t) {
	return "rgb(" +
		clamp255(Math.round(a[0] + (b[0] - a[0]) * t)) + "," +
		clamp255(Math.round(a[1] + (b[1] - a[1]) * t)) + "," +
		clamp255(Math.round(a[2] + (b[2] - a[2]) * t)) + ")";
}

// Contrast envelope for the flicker highlight: a quick ramp up to a peak
// just after the animation begins, then a slow decay to nothing as it fades.
var HIGHLIGHT_ATTACK = 0.08;  // fraction of the animation spent ramping up
var HIGHLIGHT_PEAK = 1.15;    // contrast multiplier at the peak (>1 = boosted)
function highlightEnvelope(frac) {
	if (frac < HIGHLIGHT_ATTACK) {
		return (frac / HIGHLIGHT_ATTACK) * HIGHLIGHT_PEAK;
	}
	return HIGHLIGHT_PEAK * (1 - (frac - HIGHLIGHT_ATTACK) / (1 - HIGHLIGHT_ATTACK));
}

// Apply a scheme to the page immediately, so the grid/background preview
// the chosen scheme even before the animation is started.
function applyColorScheme(index) {
	currentScheme = COLOR_SCHEMES[index] || COLOR_SCHEMES[0];
	var root = document.documentElement.style;
	root.setProperty("--page-bg", rgbStr(currentScheme.pageBg));
	root.setProperty("--grid-fg", rgbStr(currentScheme.textStart));
	root.setProperty("--box-bg", currentScheme.boxBg);
	root.setProperty("--box-border", currentScheme.boxBorder);
	root.setProperty("--title-color", currentScheme.titleColor);
}

// ---- Title layout ---------------------------------------------------------
// Lays out the title text centered in a 3-row bordered box, sized to fit
// the text with a minimum margin on either side.
function computeTitleLayout(text) {
	if (!text) text = "LET'S CRACK";

	var minMargin = 2; // minimum blank columns left outside the box, each side
	var maxBoxWidth = WIDTH - 2 * minMargin;
	var maxTextLen = Math.max(1, maxBoxWidth - 2);
	if (text.length > maxTextLen) text = text.substring(0, maxTextLen);

	var boxWidth = text.length + 2;
	var leftCol = Math.floor((WIDTH - boxWidth) / 2);
	var rightCol = leftCol + boxWidth - 1;

	var textRow = Math.floor((HEIGHT - 1) / 2);
	var topRow = textRow - 1;
	var bottomRow = textRow + 1;

	var map = {};
	for (var k = 0; k < text.length; k++) {
		var ch = text.charAt(k);
		if (ch !== " ") {
			map[textRow + "_" + (leftCol + 1 + k)] = ch;
		}
	}

	return { topRow: topRow, textRow: textRow, bottomRow: bottomRow, leftCol: leftCol, rightCol: rightCol, map: map };
}

function titleRender(id, layout) {
	var elem = document.getElementById(id);
	if (!elem) return;

	var parts = id.split("_");
	var row = parseInt(parts[0], 10);
	var col = parseInt(parts[1], 10);

	var html;
	var color = "#fff";
	// The box outline is drawn with inset box-shadows rather than borders.
	// Box-shadow never affects an element's box size, so painting it (or
	// changing it) can never nudge a neighboring cell — that's what keeps
	// the outline from causing layout jumps as it appears.
	var shadows = [];

	if (row === layout.topRow || row === layout.bottomRow || col === layout.leftCol || col === layout.rightCol) {
		html = "&nbsp;";
		if (row === layout.topRow) shadows.push("inset 0 3px 0 0 " + currentScheme.boxBorder);
		if (row === layout.bottomRow) shadows.push("inset 0 -3px 0 0 " + currentScheme.boxBorder);
		if (col === layout.leftCol) shadows.push("inset 3px 0 0 0 " + currentScheme.boxBorder);
		if (col === layout.rightCol) shadows.push("inset -3px 0 0 0 " + currentScheme.boxBorder);
	} else {
		var t = layout.map[id];
		if (t) {
			html = t;
			color = currentScheme.titleColor;
		} else {
			html = "&nbsp;";
		}
	}

	elem.innerHTML = html;
	elem.style.cssText = "color: " + color + "; background-color: " + currentScheme.boxBg + ";" +
		(shadows.length ? " box-shadow: " + shadows.join(", ") + ";" : "");
	elem.className = "cipher2";
}

// randomly change n cells to random symbols. returns array of ids of affected cells.
function changeRandomCell(n, previousCells, textColor, titleActive, hiliteBg) {
	var plainBg = rgbStr(currentScheme.pageBg);
	if (previousCells) {
		for (var i = 0; i < previousCells.length; i++) {
			var id = previousCells[i];
			if (titleActive[id]) continue;
			var prevEl = document.getElementById(id);
			if (prevEl) prevEl.style.cssText = "background-color: " + plainBg + "; color: " + textColor + ";";
		}
	}

	var a = [];
	for (var j = 0; j < n; j++) {
		var r = random(0, HEIGHT - 1);
		var c = random(0, WIDTH - 1);
		var id2 = r + "_" + c;
		if (titleActive[id2]) continue; // reserved for the title box
		var e = document.getElementById(id2);
		if (!e) continue;
		var letter = alphabet.charAt(random(0, alphabet.length - 1));
		e.innerHTML = letter;
		e.style.cssText = "background-color: " + hiliteBg + "; color: " + textColor + ";";
		a[a.length] = id2;
	}
	return a;
}

// ---- Main animation --------------------------------------------------------
// Bumped on every animateIntro() call; a run checks this against the id it
// started with so that clicking "Start Animation" again mid-animation
// retires the old run instead of having two loops fight over the same grid.
var animationRunId = 0;

async function animateIntro() {
	var runId = ++animationRunId;

	// Reset the grid to its untouched starting state so the animation can be
	// re-run without reloading the page.
	init();
	render();

	var titleField = document.getElementById("titleText").value.trim();
	var speed = parseFloat(document.getElementById("speed").value) || 1;
	var schemeIndex = parseInt(document.getElementById("colorScheme").value, 10) || 0;
	applyColorScheme(schemeIndex);

	var layout = computeTitleLayout(titleField || "LET'S CRACK");

	var title = [];
	for (var row = layout.topRow; row <= layout.bottomRow; row++) {
		for (var col = layout.leftCol; col <= layout.rightCol; col++) {
			title[title.length] = row + "_" + col;
		}
	}
	shuffle(title); // mix up the order the title cells are revealed in

	var titleActive = {};
	var a; var n = 1;
	var frames = 260;
	for (var i = 0; i < frames; i++) {
		if (runId !== animationRunId) return; // a newer run started; abandon this one

		if (i > 120 && title.length > 0) {
			var titlePos = title.pop();
			titleRender(titlePos, layout);
			titleActive[titlePos] = true;
		}

		var frac = i / (frames - 1);
		var textColor = lerpColor(currentScheme.textStart, currentScheme.pageBg, frac);
		var bgColor = lerpColor(currentScheme.pageBg, currentScheme.bgStart, highlightEnvelope(frac));

		a = changeRandomCell(Math.round(n), a, textColor, titleActive, bgColor);
		await sleep(50 / speed);
		n = Math.min(100, n * 1.03);
	}

	if (runId !== animationRunId) return; // a newer run started; abandon this one

	var finalBg = rgbStr(currentScheme.pageBg);
	for (var k = 0; k < a.length; k++) {
		var id = a[k];
		if (titleActive[id]) continue;
		var el = document.getElementById(id);
		if (el) el.style.cssText = "background-color: " + finalBg + "; color: " + finalBg + ";";
	}

	for (var r2 = 0; r2 < HEIGHT; r2++) {
		for (var c2 = 0; c2 < WIDTH; c2++) {
			if (r2 >= layout.topRow && r2 <= layout.bottomRow && c2 >= layout.leftCol && c2 <= layout.rightCol) continue;
			var e2 = document.getElementById(r2 + "_" + c2);
			if (e2) e2.style.cssText = "background-color: " + finalBg + "; color: " + finalBg + ";";
		}
	}
}

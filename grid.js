// Z340 cipher grid: the animated backdrop for the intro animation.

var WIDTH = 34;
var HEIGHT = 0;

// The Zodiac Z340 ciphertext, laid out WIDTH characters per row.
var cipherText =
"HER>pl^VPk|1LTG2dNp+B(#O%DWY.<*Kf)By:cM+UZGW()L#zHJSpp7^l8*V3pO++RK2_9M+ztjd|5FP+&4k/p8R^FlO-*dCkF>2D(#5+Kq%;2UcXGV.zL|(G2Jfj#O+_NYz+@L9d<M+b+ZR2FBcyA64K-zlUV+^J+Op7<FBy-U+R/5tE|DYBpbTMKO2<clRJ|*5T4M.+&BFz69Sy#+N|5FBc(;8RlGFN^f524b.cV4t++yBX1*:49CE>VUZ5-+|c.3zBK(Op^.fMqG2RcT+L16C<+FlWB|)L++)WCzWcPOSHT/()p|FkdW<7tB_YOB*-Cc>MDHNpkSzZO8A|K;+9%P/Z/UB%kOR=pX=BWV+eGYF69HP@K!qYeMJY^UIk7qTtNQYD5)S(/9#BPORAU%fRlqEk^LMZJdr\\pFHVWe8Y@+qGD9KI)6qX85zS(RNtIYElO8qGBTQS#BLd/P#B@XqEHMU^RRkcZKqpI)Wq!85LMr9#BPDR+j=6\\N(eEUHkF";

// Symbol pool used for the flickering "decoding" effect.
var alphabet = "ABCDEFGH|JKLMNOPRSTUVWXYZ123456789plkdfycjqbtz()>^+.<-/#_@*%&;:";

var cipher = []; // cipher[row] = string of WIDTH characters

function resetCipher() {
	cipher = [];
	var j = 0;
	while (j < cipherText.length) {
		cipher[cipher.length] = cipherText.substring(j, j + WIDTH);
		j += WIDTH;
	}
	HEIGHT = cipher.length;
}

function init() {
	resetCipher();
}

function render() {
	var container = document.getElementById("cipher");
	container.innerHTML = "";

	var table = document.createElement("table");
	table.className = "ciphertable";
	var tbody = document.createElement("tbody");

	for (var row = 0; row < cipher.length; row++) {
		var trow = document.createElement("tr");
		for (var col = 0; col < cipher[row].length; col++) {
			var cell = document.createElement("td");
			cell.id = row + "_" + col;
			cell.className = "cipher";
			cell.innerHTML = cipher[row].charAt(col);
			trow.appendChild(cell);
		}
		tbody.appendChild(trow);
	}

	table.appendChild(tbody);
	container.appendChild(table);
}

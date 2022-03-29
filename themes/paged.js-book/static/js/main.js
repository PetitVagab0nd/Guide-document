function snapImgBaseline(params) {
	const baseline = parseInt(getComputedStyle(document.documentElement).getPropertyValue(params.baselineVariableName), 10);
	const images = document.querySelectorAll("img");
	for (let i = images.length - 1; i >= 0; i--) {
		let h = images[i].height;
		images[i].height = h - (h % baseline);
	}
}

// Corrige les index et les liens des notes de bas de page
// qui se reset à chaque nouvelle page.
function footnotesOrder() {

	const foonotesSections = document.querySelectorAll('.footnotes');
	for (let i = 0; i < foonotesSections.length; i++) {
		foonotesSections[i].title = "Notes";
	}

	const footnotes = document.querySelectorAll('[data-id^=fnref]');
	const endnotes = document.querySelectorAll('[role="doc-endnote"]');

	for (let i = 0; i < footnotes.length; i++) {
		const footnote = footnotes[i];
		const footnoteRef = footnote.firstChild;
		let index = i + 1;

		footnote.id = "fnref:" + index;
		footnote.dataset.id = "fnref:" + index;
		footnoteRef.href = "#fn:" + index;
		footnoteRef.innerText = index;

		const endnote = endnotes[i];
		const footnoteBackref = endnote.querySelector('.footnote-backref');
		endnote.id = "fn:" + index;
		endnote.dataset.id = "fn:" + index;
		endnote.dataset.itemNum = index;
		footnoteBackref.href = "#fnref:" + index;
	}
}

// Intègre les notes de bas de page à l'intérieur des <aside> si il y en a
// en récupérant le <span hidden>[^X]</span> ajouté juste après les <aside>
function footnotesAside() {

	const foonotesRefAsideSpan = document.querySelectorAll('span[data-ref][hidden]');
	
	for (let i = 0; i < foonotesRefAsideSpan.length; i++) {
		var foonoteRef = foonotesRefAsideSpan[i].firstChild;
		var foonoteId = foonoteRef.id.split(":").pop();
		var aside = foonotesRefAsideSpan[i].parentNode.querySelector('aside');
		var asideChildren;
		if (aside.innerText.includes("[^"+foonoteId+"]")) {
			// si l'appel de note de bas de page se trouve sur la même page
			asideChildren = aside.children;
		} else {
			var prevPage = aside.closest(".pagedjs_page").previousElementSibling;
			asideChildren = prevPage.querySelectorAll(".pagedjs_page_content aside > *");
		}

		for (var j = asideChildren.length - 1; j >= 0; j--) {
			var asideChild = asideChildren[j];
			if (asideChild.innerText.includes("[^"+foonoteId+"]")) {
				if (asideChild.nodeName === "P") {
					replaceAsideChild(asideChild, foonoteRef, foonoteId);
				}
				else if (asideChild.nodeName === "UL") {
					for (var k = asideChild.children.length - 1; k >= 0; k--) {
						var li = asideChild.children[k];
						if (li.innerText.includes("[^"+foonoteId+"]")) {
							replaceAsideChild(li, foonoteRef, foonoteId);
						}
					}
				}
			}
		}
	}
}

function replaceAsideChild(asideChild, foonoteRef, foonoteId) {
	// get node name ("p", "ul")
	var nodeName = asideChild.nodeName.toLowerCase();
	// split text in an array containing [0] text before and [1] after footnote
	var splitedText = asideChild.innerText.split("[^"+foonoteId+"]");
	var text0 = document.createTextNode(splitedText[0]);
	var text1 = document.createTextNode(splitedText[1]);
	// create new aside child element
	var asideNewChild = document.createElement(nodeName);
	asideNewChild.appendChild(text0);
	asideNewChild.appendChild(foonoteRef);
	asideNewChild.appendChild(text1);
	// replace child element with new one
	var parent = asideChild.parentNode;
	parent.insertBefore(asideNewChild, asideChild);
	parent.removeChild(asideChild);
}

function doublePage() {
	const doublePageFigures = document.querySelectorAll('figure.double-page');

	for (var i = doublePageFigures.length - 1; i >= 0; i--) {
		var figure = doublePageFigures[i];
		var clonedFigure = figure.cloneNode(true);
		var clonedFigcaption = clonedFigure.childNodes[1];
		// delete cloned figcaption
		// clonedFigure.removeChild(clonedFigcaption);
		// append figure inside right page
		var rightPageContent = figure.closest(".pagedjs_page").nextElementSibling.querySelector('.pagedjs_page_content');
		rightPageContent.appendChild(clonedFigure);
	}
}

let classlinks = "marginnotes"; // ← Change the CLASS of the links here
let linksFloat = "outside"; // ← Change the POSITION of the links here

class marginlinks extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

  }

  beforeParsed(content) {
    let titledlinks = content.querySelectorAll("a");

    for (let j = 0; j < titledlinks.length; ++j) {
      titledlinks[j].classList.add(classlinks);
    } 
    let links = content.querySelectorAll("." + classlinks);


    for (let i = 0; i < links.length; ++i) {
      let target = links[i].getAttribute("title");
      // Add call links
      var spanCall = document.createElement("span");
      spanCall.classList.add("link-call");
      spanCall.classList.add("link-call_" + classlinks);
      spanCall.dataset.linkCall = classlinks + '-' + i + 1;
      spanCall.innerHTML=target+"";
      links[i].parentNode.insertBefore(spanCall, links[i]);

      // Add marker links
      var spanMarker = document.createElement("span");
      spanMarker.classList.add("link-marker");
      spanMarker.classList.add("link-marker_" + classlinks);
      spanMarker.dataset.linkMarker = classlinks + '-' + i + 1;
      links[i].prepend(spanMarker);


      // Hide links to avoid rendering problems
      links[i].style.display = "none";
    }


    /* link FLOAT ---------------------------------------------------------------------------------- */

    let positionRight = 'left: calc(var(--pagedjs-pagebox-width) - var(--pagedjs-margin-left) - var(--pagedjs-margin-right) - 1px); width: var(--pagedjs-margin-right);';
    let positionLeft = 'left: calc(var(--pagedjs-margin-left)*-1 - 1px); width: var(--pagedjs-margin-left);'

    let linkPosition;

    switch (linksFloat) {
      case 'inside':
        linkPosition = '.pagedjs_left_page .' + classlinks + '{' + positionRight + '} \
          .pagedjs_right_page .' + classlinks + '{' + positionLeft + '}';
        break;
      case 'left':
        linkPosition = '.pagedjs_left_page .' + classlinks + '{' + positionLeft + '} \
          .pagedjs_right_page .' + classlinks + '{' + positionLeft + '}';
        break;
      case 'right':
        linkPosition = '.pagedjs_left_page .' + classlinks + '{' + positionRight + '} \
          .pagedjs_right_page .' + classlinks + '{' + positionRight + '}';
        break;
      default:
        linkPosition = '.pagedjs_left_page .' + classlinks + '{' + positionLeft + '} \
          .pagedjs_right_page .' + classlinks + '{' + positionRight + '}';
    }


    /* SPECIFIC CSS ---------------------------------------------------------------------------------- */

    addcss('\
      body {\
        counter-reset: calllink_' + toCamelClasslink(classlinks) + ' markerlink_' + toCamelClasslink(classlinks) + ';\
      }\
      \
      .' + classlinks + '{\
          position: absolute;\
          text-align-last: initial;\
          box-sizing: border-box;\
      }\
      \
      .link-call_' + classlinks + ' {\
        counter-increment: calllink_' + toCamelClasslink(classlinks) + ';\
      }\
      \
      .link-call_' + classlinks + '::after {\
        content: "(↗)";\
      }\
      \
      .link-marker_' + classlinks + ' {\
          counter-increment: markerlink_' + toCamelClasslink(classlinks) + ';\
      }\
      .link-marker_' + classlinks + '::before {\
        content: "";\
      }\
    ' + linkPosition);

    

  } /* end beforeParsed*/


  afterPageLayout(pageElement, page, breakToken) {
    let links = pageElement.querySelectorAll("." + classlinks);
    let linkOverflow = false;

    let linksHeightAll = [];

    if (typeof (links) != 'undefined' && links != null && links.length != 0) {

      for (let n = 0; n < links.length; ++n) {
        // Display links of the page 
        links[n].style.display = "inline-block";
        // Add height of the links to array linksHeightAll 
        let linkHeight = links[n].offsetHeight;
        linksHeightAll.push(linkHeight);
        // Add margins of the links to array linksHeightAll 
        if (n >= 1) {
          let margins = biggestMargin(links[n - 1], links[n]);
          linksHeightAll.push(margins);
        }
      }


      /* FIT PAGE ------------------------------------------------------------------------------------- */

      // Calculate if all links fit on the page;
      let reducer = (accumulator, currentValue) => accumulator + currentValue;
      let allHeight = linksHeightAll.reduce(reducer);
      let maxHeight = pageElement.querySelectorAll(".pagedjs_page_content")[0].offsetHeight;

      if (allHeight > maxHeight) {

        /* IF DOESN'T FIT ----------------------------------------------------------------------------- */

        // positions all the links one after the other starting from the top
        links[0].style.top = parseInt(window.getComputedStyle(links[0]).marginBottom, 10) * -1 + "px";
        for (let a = 1; a < links.length; ++a) {
          let linkPrev = links[a - 1];
          let newMargin = biggestMargin(linkPrev, links[a]);
          let newTop = linkPrev.offsetTop + linkPrev.offsetHeight - marginlinkTop(links[a]) + newMargin;
          links[a].style.top = newTop + "px";
        }
        // alert
        let pageNumber = pageElement.dataset.pageNumber;
        alert("Rendering issue \n ☞ A marginal link overflow on page " + pageNumber + " (this is because there is too many on this page and paged.js can't breaks links between pages for now.)");
        linkOverflow = true;

      } else {

        /* PUSH DOWN ---------------------------------------------------- */
        for (let i = 0; i < links.length; ++i) {
          if (i >= 1) {
            let linkTop = links[i].offsetTop;
            let linkPrev = links[i - 1];
            let newMargin = biggestMargin(links[i], linkPrev);
            let linkPrevBottom = linkPrev.offsetTop - marginlinkTop(linkPrev) + linkPrev.offsetHeight + newMargin;
            // Push down the link to bottom if it's over the previous one 
            if (linkPrevBottom > linkTop) {
              links[i].style.top = linkPrevBottom + "px";
            }
          }
        }

        /* PUSH UP ---------------------------------------------- */

        // Height of the page content 
        let contentHeight = pageElement.querySelectorAll(".pagedjs_page_content")[0].querySelectorAll("div")[0].offsetHeight;

        // Check if last link overflow 
        let nbrLength = links.length - 1;
        let lastlink = links[nbrLength];
        let lastlinkHeight = lastlink.offsetHeight + marginlinkTop(lastlink);
        let linkBottom = lastlink.offsetTop + lastlinkHeight;

        if (linkBottom > contentHeight) {

          // Push up the last link 
          lastlink.style.top = contentHeight - lastlinkHeight + "px";

          // Push up previous link(s) if if it's over the link
          for (let i = nbrLength; i >= 1; --i) {
            let linkLastTop = links[i].offsetTop;
            let linkPrev = links[i - 1];
            let linkPrevHeight = linkPrev.offsetHeight;
            let newMargin = biggestMargin(linkPrev, links[i]);
            let linkPrevBottom = linkPrev.offsetTop + linkPrev.offsetHeight + newMargin;
            if (linkPrevBottom > linkLastTop) {
              linkPrev.style.top = links[i].offsetTop - marginlinkTop(linkPrev) - linkPrevHeight - newMargin + "px";
            }
          }

        } /* end push up */

      }

    }
  }/* end afterPageLayout*/

}
Paged.registerHandlers(marginlinks);



/* FUNCTIONS -------------------------------------------------------------------------------------- 
--------------------------------------------------------------------------------------------------- */

// MARGINS

function marginlinkTop(elem) {
  let marginTop = parseInt(window.getComputedStyle(elem).marginTop, 10)
  return marginTop;
}

function marginlinkBottom(elem) {
  let marginBottom = parseInt(window.getComputedStyle(elem).marginBottom, 10)
  return marginBottom;
}

function biggestMargin(a, b) {
  let margin;
  let marginBottom = marginlinkBottom(a);
  let marginTop = marginlinkTop(b);
  if (marginBottom > marginTop) {
    margin = marginBottom;
  } else {
    margin = marginTop;
  }
  return margin;
}


// ADD CSS

function addcss(css) {
  var head = document.getElementsByTagName('head')[0];
  var s = document.createElement('style');
  s.setAttribute('type', 'text/css');
  if (s.styleSheet) {   // IE
    s.styleSheet.cssText = css;
  } else {// the world
    s.appendChild(document.createTextNode(css));
  }
  head.appendChild(s);
}


// CAMEL CLASS link

function toCamelClasslink(elem) {
  let splitClass = elem.split("-");
  if (splitClass.length > 1) {
    for (let s = 1; s < splitClass.length; ++s) {
      let strCapilize = splitClass[s].charAt(0).toUpperCase() + splitClass[s].slice(1)
      splitClass[s] = strCapilize;
    }
  }
  let reducer = (accumulator, currentValue) => accumulator + currentValue;
  let classCamel = splitClass.reduce(reducer);
  return classCamel;
}


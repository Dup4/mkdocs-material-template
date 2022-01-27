/**
 *
 * @param {string} message
 * @returns {string}
 */
function formatErrorMessage(message) {
  const EscapeHTML = require("escape-html");
  let htmlContext = EscapeHTML(message.trim("\n")).split("\n").join("<br>");
  return (
    '<span class="math-rendering-error-message">' + htmlContext + "</span>"
  );
}

function getMathJax() {
  const { mathjax } = require("mathjax-full/js/mathjax.js");
  const { TeX } = require("mathjax-full/js/input/tex.js");
  const { SVG } = require("mathjax-full/js/output/svg.js");
  const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
  const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
  const { AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js");

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const tex = new TeX({
    packages: AllPackages,
  });
  const svg = new SVG();
  const html = mathjax.document("", {
    InputJax: tex,
    OutputJax: svg,
  });

  /**
   * @param {string} input
   * @param {boolean} displayMode
   */
  return (input, displayMode) => {
    const node = html.convert(input, { display: displayMode });
    let title = adaptor.create("title");
    adaptor.append(title, adaptor.text(input));
    adaptor.insert(title, node.children[0].children[0]);
    return adaptor.innerHTML(node);
  };
}

/**
 *
 * @param {string} content
 * @returns {string}
 */
function RenderMathJax(content) {
  const jsdom = require("jsdom");
  const util = require("util");

  const { JSDOM } = jsdom;
  const mathjax = getMathJax();

  const dom = new JSDOM(content);

  for (const node of dom.window.document.querySelectorAll(
    'script[type^="math/tex"]'
  )) {
    const mathTex = node.textContent;
    const displayMode = Boolean(node.type.match(/; *mode=display/));

    let result = null;
    try {
      result = mathjax(mathTex, displayMode);
    } catch (e) {
      let errorMessage =
        `Failed to render ${displayMode ? "display" : "inline"} math: ` +
        util.inspect(mathTex) +
        "\n" +
        e.toString();
      result = formatErrorMessage(errorMessage);
    }

    const mjxContainerNode = dom.window.document.createElement("mjx-container");
    mjxContainerNode.setAttribute("class", "MathJax");
    mjxContainerNode.setAttribute("jax", "SVG");
    mjxContainerNode.setAttribute("display", String(displayMode));
    mjxContainerNode.innerHTML = result;

    divNode = dom.window.document.createElement("div");
    divNode.setAttribute(
      "class",
      `arithmatex_${displayMode ? "display" : "inline"}`
    );
    divNode.innerHTML = mjxContainerNode.outerHTML;

    const pNode = node.parentNode;
    const ppNode = node.parentNode.parentNode;
    ppNode.insertBefore(divNode, pNode);
    ppNode.removeChild(pNode);
  }

  return dom.serialize();
}

module.exports = RenderMathJax;

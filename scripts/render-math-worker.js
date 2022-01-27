const { isMainThread, parentPort } = require("worker_threads");

if (isMainThread) {
  throw new Error("Its not a worker");
}

const RenderMathJaxFile = require("./render-mathjax-file");

parentPort.on("message", async (filename) => {
  await RenderMathJaxFile(filename);
  parentPort.postMessage("Done");
});

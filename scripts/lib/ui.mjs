import boxen from "boxen";
import pc from "picocolors";

export function printBox(message, color = (value) => value, options = {}) {
  console.log(
    boxen(color(message), {
      padding: 1,
      borderStyle: "round",
      margin: {
        top: 1,
        bottom: 1,
      },
      ...options,
    }),
  );
}

function severityBox(lines, color, title) {
  printBox(lines.join("\n"), color, { title, titleAlignment: "center" });
}

export const infoBox = (lines) => severityBox(lines, pc.cyan, "info");
export const successBox = (lines) => severityBox(lines, pc.green, "success");
export const warningBox = (lines) => severityBox(lines, pc.yellow, "warning");
export const errorBox = (lines) => severityBox(lines, pc.red, "error");

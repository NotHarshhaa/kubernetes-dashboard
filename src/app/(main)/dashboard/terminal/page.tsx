import type { Metadata } from "next";

import { TerminalView } from "./_components/terminal-view";

export const metadata: Metadata = {
  title: "Web Terminal",
  description: "Interactive xterm.js shell into cluster pods.",
};

export default function Page() {
  return <TerminalView />;
}

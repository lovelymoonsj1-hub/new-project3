import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Seteuk Studio | Subject competency drafts",description:"Turn student activity keywords into subject-specific competency drafts."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}

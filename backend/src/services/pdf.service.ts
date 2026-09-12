import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { generatePayslipHTML } from "./payslipTemplate";
import { PayslipWithRelations } from "../types";
import "dotenv/config";
const STORAGE_PATH = process.env.PDF_STORAGE_PATH ?? "./storage/pdfs";

async function generatePayslipQR(verifyUrl: string): Promise<string> {
    return QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 160,
    });
}

export async function generatePayslipPDF(
    payslip: PayslipWithRelations,
): Promise<string> {
    if (!fs.existsSync(STORAGE_PATH)) {
        fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }

    const verifyUrl = `${process.env.VERIFY_BASE_URL}/${payslip.verifyToken}`;
    const qrDataUri = await generatePayslipQR(verifyUrl);
    const html = generatePayslipHTML(payslip, { qrDataUri });
    const filename = `payslip_${payslip.id}.pdf`;
    const outputPath = path.join(STORAGE_PATH, filename);

    let browser:
        | {
              newPage: () => Promise<{
                  setContent: (h: string, o: object) => Promise<void>;
                  pdf: (o: object) => Promise<void>;
              }>;
              close: () => Promise<void>;
          }
        | undefined;
    try {
        // Puppeteer is installed separately — `npm install puppeteer`
        // Using require to avoid TS module resolution issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const puppeteer = require("puppeteer");
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser!.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.pdf({
            path: outputPath,
            format: "A4",
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });

        return outputPath;
    } finally {
        if (browser) await browser.close();
    }
}

export function getPayslipPDFPath(payslipId: string): string {
    return path.join(STORAGE_PATH, `payslip_${payslipId}.pdf`);
}

export function payslipPDFExists(payslipId: string): boolean {
    return fs.existsSync(getPayslipPDFPath(payslipId));
}

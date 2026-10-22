// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "20mb" }));
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Gambar struk tidak boleh kosong" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY tidak terkonfigurasi" });
    }
    let mimeType = "image/jpeg";
    let base64Data = imageBase64;
    const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Kamu adalah sistem OCR pembaca struk belanja untuk aplikasi pengatur keuangan Kocek.
Analisis gambar struk belanja ini secara teliti dan temukan:
1. Nama toko / merchant (contoh: Indomaret, Alfamart, Starbucks, Toko Buku Gramedia, Warung Makan, Superindo).
2. Total nominal pembayaran akhir (dalam angka integer rupiah, contoh: 45000, bukan string berformat titik atau koma).
3. Kategori yang paling sesuai dari pilihan: Makanan, Transportasi, Belanja, Hiburan, Tagihan, Pendidikan, Kesehatan & Medis, Kebutuhan Pribadi, Lainnya.
4. Catatan / rincian item utama yang dibeli (contoh: 2 Roti, Kopi Susu, Air Mineral).
5. Tanggal transaksi dalam format YYYY-MM-DD jika terbaca pada struk. Jika tidak terlihat atau ragu, kosongkan string "".

Balas HANYA objek JSON valid tanpa markdown formatting apapun, contoh:
{"merchant":"Indomaret Point","total":42500,"category":"Makanan","note":"Roti coklat, Kopi susu, Air mineral","date":""}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return res.json({
      success: true,
      merchant: parsed.merchant || "Struk Belanja",
      total: Number(parsed.total) || 0,
      category: parsed.category || "Belanja",
      note: parsed.note || "Transaksi struk belanja",
      date: parsed.date || ""
    });
  } catch (err) {
    console.error("Error scanning receipt with Gemini:", err);
    return res.status(500).json({ error: err.message || "Gagal memproses struk belanja" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3e3, host: "0.0.0.0" },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();

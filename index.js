/*
========================================
   BMS STUDIO SAWERIA - Avatar Update
   (With Discord Webhook Integration)
========================================
*/

const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let donasi = []
let topDonatur = {}
let totalDonasi = 0
let lastRawData = null

// URL Webhook Discord milikmu
const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1506799128041230367/ZmiIeJX-jQw7EbScEFeGXD28jH_lb_Y1OfSq28TE4NQhkpwLgRfQbRU9HYV5X3Wf9Hf8"

// Fungsi untuk mengirim notifikasi ke Discord
async function sendToDiscord(nama, jumlah, pesan, robloxUsername) {
    try {
        // Format nominal Rupiah
        const formatRupiah = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(jumlah);

        // Membuat payload struktur Embed Discord
        const embedPayload = {
            embeds: [
                {
                    title: "🎉 DONASI SAWERIA BARU MASUK! 🎉",
                    color: 10181046, // Warna ungu estetik / cyberpunk
                    fields: [
                        {
                            name: "👤 Nama Donatur",
                            value: nama,
                            inline: true
                        },
                        {
                            name: "💰 Jumlah Donasi",
                            value: `**${formatRupiah}**`,
                            inline: true
                        },
                        {
                            name: "🎮 Roblox Username",
                            value: robloxUsername ? `@${robloxUsername}` : "❌ Tidak mencantumkan @",
                            inline: false
                        },
                        {
                            name: "💬 Pesan",
                            value: pesan || "*(Tidak ada pesan)*",
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: "Saweria Webhook System • BMS STUDIO"
                    }
                }
            ]
        };

        // Kirim request ke Discord API menggunakan fetch bawaan Node.js (Node 18+)
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embedPayload)
        });

        console.log("🚀 Notifikasi donasi berhasil dikirim ke Discord!");
    } catch (error) {
        console.error("❌ Gagal mengirim notifikasi ke Discord:", error);
    }
}

app.post('/webhook', (req, res) => {
    lastRawData = req.body
    console.log("?? RAW:", JSON.stringify(req.body))

    const body = req.body

    let nama = body.donator_name 
    || body.donatorName 
    || body.name 
    || body.sender
    || "Anonim"

    let jumlah = 0
    if (body.amount) jumlah = Number(body.amount)
    else if (body.total) jumlah = Number(body.total)
    else if (body.amount_raw) jumlah = Number(body.amount_raw)

    let pesan = body.message || body.msg || body.note || ""

    // Detect @username di nama ATAU pesan
    let robloxUsername = null

    // Cek di nama donatur
    const namaMatch = nama.match(/@(\w+)/)
    if (namaMatch) {
        robloxUsername = namaMatch[1]
    }

    // Cek di pesan
    if (!robloxUsername) {
        const pesanMatch = pesan.match(/@(\w+)/)
        if (pesanMatch) {
            robloxUsername = pesanMatch[1]
        }
    }

    console.log(`?? ${nama} - Rp${jumlah} - Roblox: ${robloxUsername || 'none'}`)

    const waktu = Date.now()

    donasi.push({ 
        nama, 
        jumlah, 
        pesan, 
        waktu,
        robloxUsername
    })

    // Untuk top donatur, gunakan robloxUsername jika ada
    const key = robloxUsername || nama
    if (!topDonatur[key]) {
        topDonatur[key] = { total: 0, count: 0, robloxUsername }
    }
    topDonatur[key].total += jumlah
    topDonatur[key].count += 1
    topDonatur[key].robloxUsername = robloxUsername

    totalDonasi += jumlah

    // JALANKAN FUNGSI KIRIM KE DISCORD
    sendToDiscord(nama, jumlah, pesan, robloxUsername);

    res.status(200).send("OK")
})

app.get('/cek', (req, res) => {
    let data = [...donasi]
    donasi = []
    res.json(data)
})

app.get('/top', (req, res) => {
    let sorted = Object.entries(topDonatur)
        .map(([nama, data]) => ({ 
            nama, 
            total: data.total,
            count: data.count,
            robloxUsername: data.robloxUsername
        }))
        .sort((a, b) => b.total - a.total)

    res.json(sorted)
})

app.get('/stats', (req, res) => {
    res.json({
        totalDonasi,
        totalDonatur: Object.keys(topDonatur).length
    })
})

app.get('/raw', (req, res) => {
    res.json({ data: lastRawData })
})

app.get('/debug', (req, res) => {
    res.json({
        pendingDonasi: donasi,
        topDonatur,
        totalDonasi,
        lastRawData
    })
})

app.get('/test', (req, res) => {
    const names = ["@Pepekluanjg"]
    const messages = ["Semangat!", "GG bang!", "@MyRobloxName mantap!", ""]
    const nama = names[Math.floor(Math.random() * names.length)]
    const jumlah = Math.floor(Math.random() * 50000) + 1000
    const pesan = messages[Math.floor(Math.random() * messages.length)]

    let robloxUsername = null
    const namaMatch = nama.match(/@(\w+)/)
    if (namaMatch) robloxUsername = namaMatch[1]

    if (!robloxUsername) {
        const pesanMatch = pesan.match(/@(\w+)/)
        if (pesanMatch) robloxUsername = pesanMatch[1]
    }

    donasi.push({ nama, jumlah, pesan, waktu: Date.now(), robloxUsername })

    const key = robloxUsername || nama
    if (!topDonatur[key]) {
        topDonatur[key] = { total: 0, count: 0, robloxUsername }
    }
    topDonatur[key].total += jumlah
    topDonatur[key].count += 1
    totalDonasi += jumlah

    // JALANKAN FUNGSI KIRIM KE DISCORD UNTUK TEST
    sendToDiscord(nama, jumlah, pesan, robloxUsername);

    res.send(`? ${nama} - Rp${jumlah} - Roblox: ${robloxUsername || 'none'}`)
})

app.get('/reset', (req, res) => {
    topDonatur = {}
    donasi = []
    totalDonasi = 0
    res.send("Reset!")
})

app.get('/', (req, res) => {
    res.json({ 
        status: "BMS STUDIO SAWERIA",
        info: "Gunakan @username di nama atau pesan untuk link ke Roblox",
        totalDonatur: Object.keys(topDonatur).length,
        totalDonasi
    })
})

app.listen(process.env.PORT || 3000, () => {
    console.log("?? Server Running!")
})

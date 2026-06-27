const express = require('express');
const XLSX = require('xlsx');
const jalaali = require('jalaali-js');

const app = express();
const PORT = 3015;

app.use(express.static('public'));

function formatJalali(j) {
    return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}
function normalizeJalali(dateStr) {
    if (!dateStr) return null;
    return dateStr.replace(/-/g, '/').trim();
}

// فقط ساختن تاریخ‌های آینده
function getNextDays(days = 4) {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const j = jalaali.toJalaali(d);

        dates.push({
            date: formatJalali(j),
            label:
                i === 0 ? 'امروز' :
                i === 1 ? 'فردا' :
                i === 2 ? 'پس‌فردا' :
                `${i} روز دیگر`
        });
    }
    return dates;
}

// خواندن دیتا از Excel
function getAllUsers() {
    const workbook = XLSX.readFile('users.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
}
function jalaliToDate(str) {
    if (!str) return null;

    const parts = str.split('/');

    if (parts.length !== 3) return null;

    const jYear = parseInt(parts[0]);
    const jMonth = parseInt(parts[1]);
    const jDay = parseInt(parts[2]);

    const g = jalaali.toGregorian(jYear, jMonth, jDay);

    return new Date(g.gy, g.gm - 1, g.gd);
}

// API اصلی
app.get('/api/expired', (req, res) => {
    try {
        const data = getAllUsers(); // ✅ این باید همینجا باشه

        const nextDays = getNextDays();

        const resultFuture = [];
        const resultPast = [];

        const today = new Date();
        const past30Days = new Date();
        past30Days.setDate(today.getDate() - 7);

        data.forEach(user => {

    if (!user.EndDate) return;

   const matchFuture = nextDays.find(d => d.date === normalizeJalali(user.EndDate));

    if (matchFuture) {
        resultFuture.push({
            shop: user.Username,
            plate: user.User_Id,
            endDate: user.EndDate,
            status: matchFuture.label
        });
    }

    const userDate = jalaliToDate(user.EndDate);
    if (!userDate) return;

    if (userDate >= past30Days && userDate <= today) {
        resultPast.push({
            shop: user.Username,
            plate: user.User_Id,
            endDate: user.EndDate,
            status: "گذشته"
        });
    }
});

        res.json({
            future: resultFuture,
            past: resultPast
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
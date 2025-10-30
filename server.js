const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// إنشاء مجلد التحميلات
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// إعداد multer للتخزين الدائم
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const safeName = Date.now() + '-' + file.originalname;
        cb(null, safeName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// 🔥 جديد: خدمة الملفات الثابتة
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname)));

// 🔥 جديد: route لعرض الملفات المرفوعة
app.get('/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'خطأ في قراءة الملفات' });
        }
        
        const fileList = files.map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                url: `/uploads/${file}`,
                size: stats.size,
                uploaded: stats.mtime
            };
        });
        
        res.json({ files: fileList });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'لم يتم اختيار أي ملفات' 
            });
        }
        
        const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
        
        res.json({ 
            success: true, 
            message: `تم رفع ${req.files.length} ملف بنجاح!`,
            files: fileUrls  // 🔥 نرجع الـ URLs
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء الرفع' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على: http://localhost:${PORT}`);
    console.log(`📁 مجلد التحميلات: ${uploadsDir}`);
});

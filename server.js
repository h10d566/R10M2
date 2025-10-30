const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

// زيادة حجم الـ request المسموح
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// إنشاء مجلد التحميلات
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// إعداد multer مع حجم أكبر
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB - زيادة الحجم
    }
});

app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

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
        
        const fileNames = req.files.map(file => file.filename);
        res.json({ 
            success: true, 
            message: `تم رفع ${req.files.length} ملف بنجاح!`,
            files: fileNames
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء الرفع' 
        });
    }
});

// معالجة أخطاء الحجم
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                error: 'حجم الملف كبير جداً! الحد الأقصى 50MB' 
            });
        }
    }
    res.status(500).json({ 
        success: false, 
        error: error.message 
    });
});

app.listen(port, () => {
    console.log(`🌐 السيرفر شغال على: http://localhost:${port}`);
    console.log(`📁 مجلد التحميلات: ${uploadsDir}`);
    console.log(`💾 الحد الأقصى للملف: 50MB`);
});
// المسار: src/components/FileViewer.jsx
import React from 'react';
// هون بنستدعي الدالة اللي عملناها في الخطوة 1
import { handleForceDownload } from '../utils/downloadHelper'; 

const FileViewer = ({ fileUrl, fileName }) => {
  if (!fileUrl) return null; // إذا ما في رابط، ما تعرض اشي

  // بنفحص نوع الملف من الامتداد (آخر اشي بعد النقطة)
  const extension = fileUrl.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  // هل هذا الملف صورة؟
  const isImage = imageExtensions.includes(extension);

  return (
    <div style={{ marginTop: '10px' }}>
      
      {/* الحالة الأولى: إذا كان صورة */}
      {isImage ? (
        <img 
          src={fileUrl} 
          alt={fileName} 
          style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }} 
        />
      ) : (
        /* الحالة الثانية: إذا مش صورة (يعني ملف)، اعرض زر */
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>ملف مرفق: <strong>{fileName || 'download'}</strong></span>
          
          <button 
            onClick={() => handleForceDownload(fileUrl, fileName)}
            style={{
              background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            تحميل ⬇️
          </button>
        </div>
      )}

    </div>
  );
};

export default FileViewer;
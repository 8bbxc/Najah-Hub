import axios from 'axios';
import { API } from './api';

export const handleForceDownload = async (fileUrl, fileName) => {
  try {
    // تأكد أن الرابط كامل
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API}/${fileUrl}`;
    
    const response = await axios.get(fullUrl, {
      responseType: 'blob', // ضروري جداً عشان الملفات ما تخرب
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url); // تنظيف الذاكرة
  } catch (error) {
    console.error("Download Error:", error);
    // حركة احتياطية: إذا فشل الـ Blob، حاول تفتح الرابط مباشرة
    window.open(fileUrl, '_blank');
  }
};
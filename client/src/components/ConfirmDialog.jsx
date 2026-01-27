import React from 'react';

export default function ConfirmDialog({ open, title = 'تأكيد', message = 'هل أنت متأكد؟', confirmText = 'نعم، احذف', cancelText = 'إلغاء', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel}></div>
      <div className="bg-white dark:bg-gray-800 card-bg rounded-2xl shadow-2xl p-6 z-10 w-full max-w-md">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border hover:bg-gray-100 transition">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
